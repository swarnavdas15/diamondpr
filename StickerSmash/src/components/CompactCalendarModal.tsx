import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { useERP } from '../context/ERPContext';
import { CalendarEvent, CalendarEventType } from '../types';
import { Colors, Spacing, Radius, Shadows } from '../theme';
import { EventDetailsModal } from './ui/EventDetailsModal';

interface CompactCalendarModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CompactCalendarModal: React.FC<CompactCalendarModalProps> = ({ visible, onClose }) => {
  const { calendarEvents, createCalendarEvent, deleteCalendarEvent } = useERP();

  const todayDateObj = new Date();
  const todayStr = todayDateObj.toISOString().split('T')[0];

  // Calendar View Month State (default to current year/month)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 1)); // Sept 2026
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | CalendarEventType>('ALL');

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<CalendarEventType>('MEETING');
  const [description, setDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null);

  const categories: Array<{ id: 'ALL' | CalendarEventType; label: string; color: string }> = [
    { id: 'ALL', label: 'All', color: Colors.accentTeal },
    { id: 'MEETING', label: 'Meetings', color: '#3b82f6' },
    { id: 'DEADLINE', label: 'Deadlines', color: '#f97316' },
    { id: 'REMINDER', label: 'Reminders', color: '#06b6d4' },
    { id: 'FOLLOW_UP', label: 'Follow-ups', color: '#8b5cf6' },
    { id: 'IMPORTANT_DATE', label: 'Important', color: '#ef4444' },
    { id: 'MILESTONE', label: 'Milestones', color: '#10b981' },
  ];

  const getTypeBadgeColor = (t: CalendarEventType) => {
    const found = categories.find((c) => c.id === t);
    return found ? found.color : '#64748b';
  };

  // Month Navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Grid Calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysGrid: Array<{ dayNum: number | null; dateStr: string | null }> = [];

  // Blank padding cells before day 1
  for (let i = 0; i < firstDayIndex; i++) {
    daysGrid.push({ dayNum: null, dateStr: null });
  }

  // Month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    daysGrid.push({ dayNum: d, dateStr });
  }

  // Handle Event Creation
  const handleCreate = () => {
    if (!title.trim()) return;
    createCalendarEvent({
      title: title.trim(),
      type,
      eventDate: selectedDate,
      description: description.trim(),
    });
    setTitle('');
    setDescription('');
    setIsAdding(false);
  };

  // Filtered Events
  const filteredEvents = calendarEvents.filter((e) => {
    const categoryMatches = selectedCategory === 'ALL' || e.type === selectedCategory;
    return categoryMatches;
  });

  const selectedDateEvents = filteredEvents.filter((e) => e.eventDate === selectedDate);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        {/* Top-Right Dropdown Popover Modal Card */}
        <TouchableOpacity activeOpacity={1} style={styles.popoverCard} onPress={(e) => e.stopPropagation()}>
          {/* Header Bar */}
          <View style={styles.popoverHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.popoverIcon}>📅</Text>
              <View>
                <Text style={styles.popoverTitle}>Interactive ERP Calendar</Text>
                <Text style={styles.popoverSub}>Schedule meetings, deadlines & milestones</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.popoverBody} showsVerticalScrollIndicator={false}>
            {/* Month Header Navigation */}
            <View style={styles.monthNavRow}>
              <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
                <Text style={styles.navBtnText}>◀</Text>
              </TouchableOpacity>

              <Text style={styles.monthTitleText}>{monthName}</Text>

              <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
                <Text style={styles.navBtnText}>▶</Text>
              </TouchableOpacity>
            </View>

            {/* Monthly Calendar Grid */}
            <View style={styles.calendarGridContainer}>
              {/* Weekday Labels */}
              <View style={styles.weekdayRow}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => (
                  <Text key={w} style={styles.weekdayText}>{w}</Text>
                ))}
              </View>

              {/* Days Grid */}
              <View style={styles.daysMatrix}>
                {daysGrid.map((item, idx) => {
                  if (!item.dayNum || !item.dateStr) {
                    return <View key={`blank-${idx}`} style={styles.dayCellEmpty} />;
                  }

                  const isToday = item.dateStr === todayStr;
                  const isSelected = item.dateStr === selectedDate;
                  const dayEvents = calendarEvents.filter((e) => e.eventDate === item.dateStr);

                  return (
                    <TouchableOpacity
                      key={item.dateStr}
                      style={[
                        styles.dayCell,
                        isToday && styles.todayDayCell,
                        isSelected && styles.selectedDayCell,
                      ]}
                      onPress={() => setSelectedDate(item.dateStr!)}
                    >
                      <Text
                        style={[
                          styles.dayNumText,
                          isToday && styles.todayNumText,
                          isSelected && styles.selectedNumText,
                        ]}
                      >
                        {item.dayNum}
                      </Text>

                      {/* Event Dot Indicators */}
                      {dayEvents.length > 0 && (
                        <View style={styles.dotRow}>
                          {dayEvents.slice(0, 3).map((e) => (
                            <View
                              key={e.id}
                              style={[styles.eventDot, { backgroundColor: getTypeBadgeColor(e.type) }]}
                            />
                          ))}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Category Filter Chips */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Filter Event Categories</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipRow}>
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        isActive && { backgroundColor: cat.color, borderColor: Colors.primaryLight },
                      ]}
                      onPress={() => setSelectedCategory(cat.id)}
                    >
                      <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Selected Date Header & Event Action */}
            <View style={styles.eventsHeaderRow}>
              <View>
                <Text style={styles.selectedDateTitle}>
                  Events for {selectedDate} {selectedDate === todayStr ? '(TODAY)' : ''}
                </Text>
                <Text style={styles.eventsCountSub}>{selectedDateEvents.length} entry(s) scheduled</Text>
              </View>

              <TouchableOpacity
                style={styles.addEventBtn}
                onPress={() => setIsAdding(!isAdding)}
              >
                <Text style={styles.addEventBtnText}>{isAdding ? 'Cancel' : '+ Add Event'}</Text>
              </TouchableOpacity>
            </View>

            {/* Event Form Drawer */}
            {isAdding && (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Add Event for {selectedDate}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Title (e.g. Client Hydro-Test Meeting)"
                  placeholderTextColor="#94a3b8"
                  value={title}
                  onChangeText={setTitle}
                />

                <Text style={styles.inputLabel}>Event Type:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeOptionRow}>
                  {categories.filter((c) => c.id !== 'ALL').map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.typeSelectChip,
                        type === c.id && { backgroundColor: c.color },
                      ]}
                      onPress={() => setType(c.id as CalendarEventType)}
                    >
                      <Text style={[styles.typeSelectText, type === c.id && { color: Colors.white }]}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TextInput
                  style={[styles.input, { height: 48 }]}
                  placeholder="Description / Remarks (Optional)"
                  placeholderTextColor="#94a3b8"
                  multiline
                  value={description}
                  onChangeText={setDescription}
                />

                <TouchableOpacity style={styles.saveFormBtn} onPress={handleCreate}>
                  <Text style={styles.saveFormBtnText}>Save Event to Schedule</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Event Cards List */}
            <View style={styles.eventsListContainer}>
              {selectedDateEvents.length === 0 ? (
                <View style={styles.noEventsBox}>
                  <Text style={styles.noEventsText}>No events scheduled for {selectedDate}.</Text>
                  <Text style={styles.noEventsSub}>Click '+ Add Event' above to add a meeting or deadline.</Text>
                </View>
              ) : (
                selectedDateEvents.map((evt) => (
                  <TouchableOpacity
                    key={evt.id}
                    style={styles.eventCard}
                    onPress={() => setViewingEvent(evt)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.eventCardTop}>
                      <View style={[styles.badge, { backgroundColor: getTypeBadgeColor(evt.type) }]}>
                        <Text style={styles.badgeText}>{evt.type.replace('_', ' ')}</Text>
                      </View>
                      <TouchableOpacity onPress={() => deleteCalendarEvent(evt.id)}>
                        <Text style={styles.deleteText}>🗑 Delete</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.eventTitle}>{evt.title}</Text>
                    {evt.description ? <Text style={styles.eventDesc}>{evt.description}</Text> : null}
                    <Text style={styles.eventUser}>Created by: {evt.createdByName}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </ScrollView>
        </TouchableOpacity>

        {/* Detail View Modal */}
        <EventDetailsModal
          visible={!!viewingEvent}
          event={viewingEvent}
          onClose={() => setViewingEvent(null)}
          onDelete={(id) => deleteCalendarEvent(id)}
        />
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 22, 34, 0.65)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 24,
  },
  popoverCard: {
    width: 440,
    maxHeight: 650,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.md,
  },
  popoverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  popoverIcon: {
    fontSize: 20,
  },
  popoverTitle: {
    color: Colors.textLight,
    fontSize: 15,
    fontWeight: '800',
  },
  popoverSub: {
    color: Colors.accentTeal,
    fontSize: 10,
  },
  closeBtn: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  closeBtnText: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '700',
  },
  popoverBody: {
    flex: 1,
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
  },
  navBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  navBtnText: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '800',
  },
  monthTitleText: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '800',
  },
  calendarGridContainer: {
    backgroundColor: Colors.primaryDark,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  weekdayText: {
    width: 50,
    textAlign: 'center',
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '800',
  },
  daysMatrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellEmpty: {
    width: 50,
    height: 38,
  },
  dayCell: {
    width: 50,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.xs,
    marginVertical: 2,
  },
  todayDayCell: {
    backgroundColor: 'rgba(75, 113, 114, 0.25)',
    borderWidth: 1,
    borderColor: Colors.accentTeal,
  },
  selectedDayCell: {
    backgroundColor: Colors.accentTeal,
  },
  dayNumText: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
  todayNumText: {
    color: Colors.primaryLight,
    fontWeight: '800',
  },
  selectedNumText: {
    color: Colors.white,
    fontWeight: '900',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  filterSection: {
    marginBottom: Spacing.md,
  },
  filterSectionTitle: {
    color: Colors.primaryLight,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  filterChipRow: {
    flexDirection: 'row',
  },
  categoryChip: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  categoryChipText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  categoryChipTextActive: {
    color: Colors.white,
  },
  eventsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  selectedDateTitle: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '800',
  },
  eventsCountSub: {
    color: Colors.accentTeal,
    fontSize: 10,
  },
  addEventBtn: {
    backgroundColor: Colors.industrialOrange,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    ...Shadows.glowOrange,
  },
  addEventBtnText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  formCard: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    gap: 6,
  },
  formTitle: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '800',
  },
  input: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    color: Colors.textLight,
    fontSize: 11,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  inputLabel: {
    color: Colors.accentTeal,
    fontSize: 10,
    fontWeight: '700',
  },
  typeOptionRow: {
    flexDirection: 'row',
  },
  typeSelectChip: {
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    marginRight: 4,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  typeSelectText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  saveFormBtn: {
    backgroundColor: Colors.secondary,
    paddingVertical: 6,
    borderRadius: Radius.xs,
    alignItems: 'center',
    marginTop: 4,
  },
  saveFormBtnText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  eventsListContainer: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  noEventsBox: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  noEventsText: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
  noEventsSub: {
    color: Colors.textSubtle,
    fontSize: 10,
    marginTop: 2,
  },
  eventCard: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    gap: 3,
  },
  eventCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  deleteText: {
    color: Colors.industrialOrange,
    fontSize: 10,
    fontWeight: '700',
  },
  eventTitle: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
  eventDesc: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  eventUser: {
    color: Colors.textSubtle,
    fontSize: 10,
    marginTop: 2,
  },
});
