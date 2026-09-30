import fs from 'fs';

let content = fs.readFileSync('StickerSmash/src/components/views/PlaceholderViews.tsx', 'utf-8');

// Ensure Image is imported
if (!content.includes('Image')) {
  content = content.replace(
    `import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';`,
    `import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Image } from 'react-native';`
  );
}

// Replace header
content = content.replace(
  `<Text style={[styles.th, { width: 140 }]}>Contact Person</Text>`,
  `<Text style={[styles.th, { width: 170 }]}>Contact Person</Text>`
);

// Replace row
const newContactPersonCol = `
                <View style={{ width: 170, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 }}>
                  {c.profileImage ? (
                    <Image source={{ uri: c.profileImage }} style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.borderDark }} />
                  ) : (
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.borderDark, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: Colors.white, fontSize: 10, fontWeight: '700' }}>{c.contactName ? c.contactName[0].toUpperCase() : '?'}</Text>
                    </View>
                  )}
                  <Text style={[styles.td, { width: '100%', paddingHorizontal: 0 }]} numberOfLines={1}>{c.contactName || 'N/A'}</Text>
                </View>
`;

content = content.replace(
  `<Text style={[styles.td, { width: 140 }]}>{c.contactName || 'N/A'}</Text>`,
  newContactPersonCol
);

fs.writeFileSync('StickerSmash/src/components/views/PlaceholderViews.tsx', content);
console.log('Updated PlaceholderViews.tsx');
