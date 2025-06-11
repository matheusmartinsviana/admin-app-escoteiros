import type { Event } from "./types";

export function generateEventInvite(event: Event): string {
  const formatDate = (dateString: string): string => {
    try {
      const [year, month, day] = dateString.split("-");
      const date = new Date(
        Number.parseInt(year),
        Number.parseInt(month) - 1,
        Number.parseInt(day)
      );

      return date.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatTime = (timeString: string): string => {
    try {
      const [hours, minutes] = timeString.split(":");
      return `${hours}:${minutes}`;
    } catch (error) {
      return timeString;
    }
  };

  const getStatusEmoji = (status: string): string => {
    switch (status) {
      case "andamento":
        return "🟢";
      case "realizado":
        return "✅";
      case "cancelado":
        return "❌";
      default:
        return "📅";
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "andamento":
        return "Confirmado";
      case "realizado":
        return "Realizado";
      case "cancelado":
        return "Cancelado";
      default:
        return status;
    }
  };

  const eventDate = formatDate(event.event_date);
  const eventTime = formatTime(event.event_time);
  const statusEmoji = getStatusEmoji(event.status);
  const statusText = getStatusText(event.status);

  return `⚜️ *GRUPO ESCOTEIRO PIRABEIRABA* ⚜️

${statusEmoji} *${event.title.toUpperCase()}*

📅 *Data:* ${eventDate}
🕐 *Horário:* ${formatTime(event.event_time)}

📝 *Sobre o evento:*
${
  event.description ||
  "Atividade especial do Grupo Escoteiro Pirabeiraba. Venha participar desta experiência única de aprendizado, diversão e crescimento pessoal!"
}

📍 *Local:* ${event.location}

📞 *Dúvidas?* Entre em contato com a chefia do grupo

---
🏕️ *Grupo Escoteiro Pirabeiraba*
📍 Pirabeiraba - Joinville/SC`;
}

export function generateSimpleInvite(event: Event): string {
  const formatDate = (dateString: string): string => {
    try {
      const [year, month, day] = dateString.split("-");
      const date = new Date(
        Number.parseInt(year),
        Number.parseInt(month) - 1,
        Number.parseInt(day)
      );

      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatTime = (timeString: string): string => {
    return timeString.slice(0, 5);
  };

  return `⚜️ *Grupo Escoteiro Pirabeiraba* ⚜️

📅 *${event.title}*
🗓️ ${formatDate(event.event_date)} às ${formatTime(event.event_time)}

📝 ${event.description || "Atividade escoteira especial!"}

🎯 Traga uniforme, água e lanche
📍 Sede do Grupo Escoteiro Pirabeiraba

⚜️ *Sempre Alerta!*`;
}

export function generateWhatsAppInvite(event: Event): string {
  const formatDate = (dateString: string): string => {
    try {
      const [year, month, day] = dateString.split("-");
      const date = new Date(
        Number.parseInt(year),
        Number.parseInt(month) - 1,
        Number.parseInt(day)
      );

      return date.toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatTime = (timeString: string): string => {
    return timeString.slice(0, 5);
  };

  return `⚜️ *ESCOTEIROS PIRABEIRABA* ⚜️

🏕️ *${event.title}*
📅 ${formatDate(event.event_date)} - ${formatTime(event.event_time)}

${event.description || "Atividade escoteira especial!"}

🎒 Traga: uniforme, água e lanche
📍 Sede do grupo

⚜️ *Sempre Alerta!*`;
}
