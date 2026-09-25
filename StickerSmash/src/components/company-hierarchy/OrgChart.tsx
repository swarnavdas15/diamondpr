import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { CompanyContact } from '../../types';
import { OrgNode } from './OrgNode';
import { Colors, Spacing, Radius, Shadows } from '../../theme';

interface OrgChartProps {
  contacts: CompanyContact[];
  onSelectNode: (contact: CompanyContact) => void;
  selectedContactId?: string;
}

export const OrgChart: React.FC<OrgChartProps> = ({ contacts, onSelectNode, selectedContactId }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.15, 1.6));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.15, 0.6));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const toggleExpand = (contactId: string) => {
    setCollapsedNodes((prev) => ({
      ...prev,
      [contactId]: !prev[contactId],
    }));
  };

  const expandAll = () => {
    setCollapsedNodes({});
  };

  const collapseAll = () => {
    const newCollapsed: Record<string, boolean> = {};
    contacts.forEach((c) => {
      newCollapsed[c.id] = true;
    });
    setCollapsedNodes(newCollapsed);
  };

  // Find top-level root contacts (reportsToId is undefined or points to a non-existing contact in this company)
  const rootContacts = contacts.filter(
    (c) => !c.reportsToId || !contacts.some((parent) => parent.id === c.reportsToId)
  );

  // Recursive Tree Branch Renderer
  const renderTreeBranch = (contact: CompanyContact) => {
    const children = contacts.filter((c) => c.reportsToId === contact.id);
    const hasChildren = children.length > 0;
    const isExpanded = !collapsedNodes[contact.id];

    return (
      <View key={contact.id} style={styles.treeBranchContainer}>
        {/* Node Component */}
        <OrgNode
          contact={contact}
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          directReportsCount={children.length}
          isSelected={selectedContactId === contact.id}
          onSelectNode={onSelectNode}
          onToggleExpand={toggleExpand}
        />

        {/* Children Sub-Tree Branch */}
        {hasChildren && isExpanded && (
          <View style={styles.childrenContainer}>
            {/* Top Connector Vertical Line */}
            <View style={styles.verticalConnector} />

            {/* Horizontal Line Spanning Across Multiple Children */}
            {children.length > 1 && <View style={styles.horizontalConnectorLine} />}

            <View style={styles.childrenRow}>
              {children.map((child) => (
                <View key={child.id} style={styles.childWrapper}>
                  {/* Top connector for each child */}
                  <View style={styles.verticalConnector} />
                  {renderTreeBranch(child)}
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  if (contacts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🌳</Text>
        <Text style={styles.emptyTitle}>No Company Contacts Registered</Text>
        <Text style={styles.emptySub}>
          Click "+ Add Contact Person" to build the organization hierarchy tree.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Interactive Controls Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
          <Text style={styles.toolbarTitle}>ORGANIZATION HIERARCHY TREE</Text>
          <Text style={styles.toolbarSub}>{contacts.length} Members • Top-Down Structure</Text>
        </View>

        <View style={styles.toolbarRight}>
          <TouchableOpacity style={styles.toolBtn} onPress={handleZoomOut}>
            <Text style={styles.toolBtnText}>🔍 −</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolBtn} onPress={handleResetZoom}>
            <Text style={styles.toolBtnText}>{Math.round(zoomLevel * 100)}%</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolBtn} onPress={handleZoomIn}>
            <Text style={styles.toolBtnText}>🔍 +</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.toolBtnOutline} onPress={expandAll}>
            <Text style={styles.toolBtnOutlineText}>Expand All</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolBtnOutline} onPress={collapseAll}>
            <Text style={styles.toolBtnOutlineText}>Collapse All</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Canvas Viewport with Zooming & Pan Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        showsVerticalScrollIndicator
        style={styles.viewport}
      >
        <ScrollView style={{ padding: Spacing.xl }}>
          <View
            style={[
              styles.treeCanvas,
              { transform: [{ scale: zoomLevel }] },
            ]}
          >
            {rootContacts.map((root) => (
              <View key={root.id} style={styles.rootWrapper}>
                {renderTreeBranch(root)}
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    overflow: 'hidden',
    minHeight: 460,
    ...Shadows.sm,
  },
  toolbar: {
    backgroundColor: Colors.bgDark,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  toolbarLeft: {
    flexDirection: 'column',
  },
  toolbarTitle: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  toolbarSub: {
    color: Colors.textSubtle,
    fontSize: 11,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolBtn: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  toolBtnText: {
    color: Colors.textLight,
    fontSize: 11,
    fontWeight: '800',
  },
  toolBtnOutline: {
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.accentTeal,
  },
  toolBtnOutlineText: {
    color: Colors.accentTeal,
    fontSize: 11,
    fontWeight: '800',
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: Colors.borderDark,
    marginHorizontal: 4,
  },
  viewport: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  treeCanvas: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  rootWrapper: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  treeBranchContainer: {
    alignItems: 'center',
  },
  childrenContainer: {
    alignItems: 'center',
    width: '100%',
  },
  verticalConnector: {
    width: 2,
    height: 20,
    backgroundColor: Colors.accentTeal,
  },
  horizontalConnectorLine: {
    height: 2,
    backgroundColor: Colors.accentTeal,
    width: '82%',
    alignSelf: 'center',
  },
  childrenRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 12,
  },
  childWrapper: {
    alignItems: 'center',
  },
  emptyContainer: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderDark,
    minHeight: 280,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '800',
  },
  emptySub: {
    color: Colors.textSubtle,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});
