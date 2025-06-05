-- Adicionar coluna de localização à tabela de eventos
ALTER TABLE events ADD COLUMN location TEXT;

-- Atualizar eventos existentes com uma localização padrão
UPDATE events SET location = 'Sede do Grupo Escoteiro Pirabeiraba' WHERE location IS NULL;
