const fs = require('fs');
const file = 'StickerSmash/src/components/CompactCalendarModal.tsx';
let data = fs.readFileSync(file, 'utf8');
data = data.replace('const { calendarEvents, companyImportantDates, createCalendarEvent, deleteCalendarEvent, deleteCompanyImportantDate } = useERP();', 'const { clients, calendarEvents, companyImportantDates, createCalendarEvent, deleteCalendarEvent, deleteCompanyImportantDate } = useERP();');
data = data.replace('title: d.title,', 'title: (clients.find(c => c.id === d.companyId)?.companyName || "Client") + " - " + d.title,');
fs.writeFileSync(file, data);
