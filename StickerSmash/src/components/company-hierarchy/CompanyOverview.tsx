import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Client, CompanyContact } from '../../types';
import { Colors, Spacing, Radius, Shadows } from '../../theme';

interface CompanyOverviewProps {
  client: Client;
  contacts: CompanyContact[];
}

export const CompanyOverview: React.FC<CompanyOverviewProps> = ({ client, contacts }) => {
  const companyContactsCount = contacts.length;
  const initialLetter = client.companyName ? client.companyName.charAt(0).toUpperCase() : 'C';

  return (
    <View style={styles.container}>
      {/* Header Banner Card */}
      <View style={styles.headerCard}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>{initialLetter}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.companyName}>{client.companyName}</Text>
            <View style={styles.codeTag}>
              <Text style={styles.codeTagText}>{client.clientCode}</Text>
            </View>
          </View>

          <Text style={styles.industryText}>
            🏭 {client.industry || 'Manufacturing & Heavy Engineering'} • 📍 {client.address || 'Address Not Specified'}
          </Text>
        </View>
      </View>

      {/* Clean ERP Information Grid */}
      <View style={styles.grid}>
        {/* Card 1: Key Registration Tax Details */}
        <View style={styles.infoCard}>
          <Text style={styles.cardHeaderTitle}>📜 Tax & Registration</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>GST Number:</Text>
            <Text style={styles.infoValHighlight}>{client.gstNumber || '27AAACA12341Z5'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>PAN Number:</Text>
            <Text style={styles.infoVal}>{client.panNumber || 'AAACA12341'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Client Code:</Text>
            <Text style={styles.infoVal}>{client.clientCode}</Text>
          </View>
        </View>

        {/* Card 2: Contact & Online Presence */}
        <View style={styles.infoCard}>
          <Text style={styles.cardHeaderTitle}>🌐 Contact & Digital</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Website:</Text>
            <Text style={[styles.infoVal, { color: Colors.roles.SALES }]}>
              {client.website || `www.${client.clientCode.toLowerCase()}.example.com`}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Primary Phone:</Text>
            <Text style={styles.infoVal}>{client.contactNo}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Official Email:</Text>
            <Text style={styles.infoVal}>{client.email || 'N/A'}</Text>
          </View>
        </View>

        {/* Card 3: Account Stats & Organization Info */}
        <View style={styles.infoCard}>
          <Text style={styles.cardHeaderTitle}>👥 Account Overview</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Contacts:</Text>
            <View style={styles.contactBadge}>
              <Text style={styles.contactBadgeText}>{companyContactsCount} Contact Persons</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Primary Contact:</Text>
            <Text style={styles.infoValBold}>{client.contactName || 'Not Set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Registered Date:</Text>
            <Text style={styles.infoVal}>
              {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'Sep 2026'}
            </Text>
          </View>
        </View>
      </View>

      {/* Description / Remarks Card */}
      <View style={styles.descriptionCard}>
        <Text style={styles.cardHeaderTitle}>📝 Company Description & Notes</Text>
        <Text style={styles.descriptionText}>
          {client.description ||
            client.remarks ||
            `${client.companyName} is an authorized industrial client specializing in heavy mechanical fabrications, pressure vessel components, and forged flange requirements.`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  headerCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.sm,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accentTeal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBadgeText: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '800',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  companyName: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: '800',
  },
  codeTag: {
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.roles.SALES,
  },
  codeTagText: {
    color: Colors.roles.SALES,
    fontSize: 12,
    fontWeight: '800',
  },
  industryText: {
    color: Colors.textSubtle,
    fontSize: 12,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  infoCard: {
    flex: 1,
    minWidth: 240,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.sm,
  },
  cardHeaderTitle: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    paddingBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  infoLabel: {
    color: Colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
  },
  infoVal: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  infoValBold: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '800',
  },
  infoValHighlight: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '800',
  },
  contactBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  contactBadgeText: {
    color: Colors.status.COMPLETED.bg,
    fontSize: 11,
    fontWeight: '800',
  },
  descriptionCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadows.sm,
  },
  descriptionText: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
