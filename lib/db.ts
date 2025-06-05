import { neon } from "@neondatabase/serverless"

// Environment variable check
const NEON_DB_URL = process.env.NEON_DB_URL
if (!NEON_DB_URL) {
  console.error("Missing Neon database URL")
  throw new Error("NEON_DB_URL must be set")
}

// Database connection
export const sql = neon(NEON_DB_URL)

// Database initialization flag
let dbInitialized = false

// Function to initialize database tables and default data
export async function initializeDatabase() {
  if (dbInitialized) {
    console.log("Database already initialized, skipping...")
    return
  }

  try {
    console.log("Starting database initialization...")

    // Test database connection first
    try {
      await sql`SELECT 1 as test`
      console.log("Database connection successful")
    } catch (connectionError) {
      console.error("Database connection failed:", connectionError)
      throw new Error("Falha na conexão com o banco de dados")
    }

    // Create users table
    console.log("Creating users table...")
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log("Users table created/verified")

    // Create events table
    console.log("Creating events table...")
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_date DATE NOT NULL,
        event_time TIME NOT NULL,
        status VARCHAR(50) DEFAULT 'andamento',
        image_url TEXT,
        location TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log("Events table created/verified")

    // Update existing events table to support larger images
    try {
      await sql`
        ALTER TABLE events ALTER COLUMN image_url TYPE TEXT
      `
      console.log("Updated image_url column to TEXT type")
    } catch (error) {
      // Column might already be TEXT type, ignore error
      console.log("image_url column already TEXT type or update not needed")
    }

    // Add location column if it doesn't exist
    try {
      await sql`
        ALTER TABLE events ADD COLUMN IF NOT EXISTS location TEXT
      `
      console.log("Added location column to events table")

      // Update existing events with default location
      await sql`
        UPDATE events SET location = 'Sede do Grupo Escoteiro Pirabeiraba' WHERE location IS NULL
      `
      console.log("Updated existing events with default location")
    } catch (error) {
      // Column might already exist, ignore error
      console.log("Location column already exists or update not needed")
    }

    // Check if admin user exists
    const existingUsers = await sql`
      SELECT COUNT(*) as count FROM users WHERE email = 'admin@escoteiros.com'
    `

    // Create admin user if it doesn't exist
    if (existingUsers[0].count === 0) {
      // Import hashPassword here to avoid circular dependency
      const bcrypt = await import("bcryptjs")
      const hashedPassword = await bcrypt.hash("admin123", 10)

      await sql`
        INSERT INTO users (email, password, name) 
        VALUES ('admin@escoteiros.com', ${hashedPassword}, 'Administrador')
      `

      console.log("Admin user created successfully")
    }

    // Check if sample events exist
    const existingEvents = await sql`
      SELECT COUNT(*) as count FROM events
    `

    // Insert sample events if none exist
    if (existingEvents[0].count === 0) {
      const sampleEvents = [
        {
          title: "Acampamento de Verão",
          description: "Acampamento anual de verão para todos os grupos",
          event_date: "2024-01-15",
          event_time: "09:00",
          status: "realizado",
          location: "Sede do Grupo Escoteiro Pirabeiraba",
        },
        {
          title: "Reunião Semanal",
          description: "Reunião semanal do grupo escoteiro",
          event_date: "2024-12-20",
          event_time: "19:00",
          status: "andamento",
          location: "Sede do Grupo Escoteiro Pirabeiraba",
        },
        {
          title: "Caminhada Ecológica",
          description: "Atividade de conscientização ambiental",
          event_date: "2024-12-25",
          event_time: "08:00",
          status: "andamento",
          location: "Parque Municipal de Pirabeiraba",
        },
        {
          title: "Festival de Talentos",
          description: "Apresentação dos talentos dos escoteiros",
          event_date: "2024-11-10",
          event_time: "15:00",
          status: "cancelado",
          location: "Escola Municipal de Pirabeiraba",
        },
      ]

      for (const event of sampleEvents) {
        await sql`
          INSERT INTO events (title, description, event_date, event_time, status, location)
          VALUES (${event.title}, ${event.description}, ${event.event_date}, ${event.event_time}, ${event.status}, ${event.location})
        `
      }

      console.log("Sample events created successfully")
    }

    dbInitialized = true
    console.log("Database initialization completed successfully")
  } catch (error) {
    console.error("Critical error during database initialization:", error)
    dbInitialized = false
    throw error
  }
}

// Helper function to ensure database is initialized before any operation
export async function ensureDbInitialized() {
  if (!dbInitialized) {
    console.log("Database not initialized, initializing now...")
    await initializeDatabase()
  } else {
    console.log("Database already initialized")
  }
}
