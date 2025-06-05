import { sql, initializeDatabase } from "@/lib/db"
import { hashPassword } from "@/lib/auth"

async function seedDatabase() {
  try {
    console.log("Initializing database...")
    await initializeDatabase()

    // Create admin user with hashed password
    const hashedPassword = await hashPassword("admin123")

    await sql`
      INSERT INTO users (email, password, name) 
      VALUES ('admin@escoteiros.com', ${hashedPassword}, 'Administrador')
      ON CONFLICT (email) DO UPDATE SET password = ${hashedPassword}
    `

    // Insert sample events
    const sampleEvents = [
      {
        title: "Acampamento de Verão",
        description: "Acampamento anual de verão para todos os grupos",
        event_date: "2024-01-15",
        event_time: "09:00",
        status: "realizado",
      },
      {
        title: "Reunião Semanal",
        description: "Reunião semanal do grupo escoteiro",
        event_date: "2024-12-20",
        event_time: "19:00",
        status: "andamento",
      },
      {
        title: "Caminhada Ecológica",
        description: "Atividade de conscientização ambiental",
        event_date: "2024-12-25",
        event_time: "08:00",
        status: "andamento",
      },
      {
        title: "Festival de Talentos",
        description: "Apresentação dos talentos dos escoteiros",
        event_date: "2024-11-10",
        event_time: "15:00",
        status: "cancelado",
      },
    ]

    for (const event of sampleEvents) {
      await sql`
        INSERT INTO events (title, description, event_date, event_time, status)
        VALUES (${event.title}, ${event.description}, ${event.event_date}, ${event.event_time}, ${event.status})
        ON CONFLICT DO NOTHING
      `
    }

    console.log("Database seeded successfully!")
    console.log("Admin credentials: admin@escoteiros.com / admin123")
  } catch (error) {
    console.error("Error seeding database:", error)
  }
}

// Run if this file is executed directly
if (require.main === module) {
  seedDatabase()
}

export { seedDatabase }
