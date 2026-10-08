const fs = require('fs');

let file = fs.readFileSync('StickerSmash/src/context/ERPContext.tsx', 'utf8');

// Inject the useMemo hook
if (!file.includes('computedCalendarEvents')) {
  file = file.replace(
    'const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);',
    `const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);\n\n  const computedCalendarEvents = React.useMemo(() => {\n    const quotationEvents = quotations\n      .filter(q => q.followUpDate && q.status !== 'FULLY_CONVERTED' && q.status !== 'LOST')\n      .map(q => ({\n        id: \`qf-\${q.id}\`,\n        title: \`Follow-up: \${q.companyName}\`,\n        type: 'MEETING' as CalendarEventType,\n        eventDate: q.followUpDate as string,\n        description: \`Quotation \${q.quotationNumber} follow-up for \${q.quotationAmount}\`,\n        createdByName: q.salesExecutive || 'System',\n        createdAt: q.createdAt\n      }));\n    return [...calendarEvents, ...quotationEvents].sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());\n  }, [calendarEvents, quotations]);`
  );

  // Replace calendarEvents with computedCalendarEvents in the provider
  file = file.replace(
    'tasks,\n        calendarEvents,\n        selectedOrder',
    'tasks,\n        calendarEvents: computedCalendarEvents,\n        selectedOrder'
  );

  fs.writeFileSync('StickerSmash/src/context/ERPContext.tsx', file);
  console.log("Injected computedCalendarEvents");
} else {
  console.log("Already has computedCalendarEvents");
}
