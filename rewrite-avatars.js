import fs from 'fs';

// 1. Update ContactManagement.tsx
let cm = fs.readFileSync('StickerSmash/src/components/company-hierarchy/ContactManagement.tsx', 'utf-8');
if (!cm.includes('Image')) {
  cm = cm.replace(
    `import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';`,
    `import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Image } from 'react-native';`
  );
}

const cmAvatarCode = `
                      {c.profileImage ? (
                        <Image source={{ uri: c.profileImage }} style={[styles.tableAvatar, { backgroundColor: Colors.borderDark }]} />
                      ) : (
                        <View style={styles.tableAvatar}>
                          <Text style={styles.tableAvatarText}>{initial}</Text>
                        </View>
                      )}
`;

cm = cm.replace(
  `<View style={styles.tableAvatar}>
                        <Text style={styles.tableAvatarText}>{initial}</Text>
                      </View>`,
  cmAvatarCode
);
fs.writeFileSync('StickerSmash/src/components/company-hierarchy/ContactManagement.tsx', cm);

// 2. Update OrgChart.tsx
let oc = fs.readFileSync('StickerSmash/src/components/company-hierarchy/OrgChart.tsx', 'utf-8');
if (!oc.includes('Image')) {
  oc = oc.replace(
    `import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';`,
    `import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image } from 'react-native';`
  );
}

const ocAvatarCode = `
      {contact.profileImage ? (
        <Image source={{ uri: contact.profileImage }} style={styles.avatarImg} />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{contact.fullName.charAt(0).toUpperCase()}</Text>
        </View>
      )}
`;

oc = oc.replace(
  `<View style={styles.avatar}>
          <Text style={styles.avatarText}>{contact.fullName.charAt(0).toUpperCase()}</Text>
        </View>`,
  ocAvatarCode
);

const ocStyles = `
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.borderDark,
    marginBottom: 8,
  },
`;

if (!oc.includes('avatarImg')) {
  oc = oc.replace(
    `  avatar: {`,
    ocStyles + `\n  avatar: {`
  );
}
fs.writeFileSync('StickerSmash/src/components/company-hierarchy/OrgChart.tsx', oc);

// 3. Update ContactDrawer.tsx
let cd = fs.readFileSync('StickerSmash/src/components/company-hierarchy/ContactDrawer.tsx', 'utf-8');
if (!cd.includes('Image')) {
  cd = cd.replace(
    `import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';`,
    `import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';`
  );
}

const cdAvatarCode = `
              {contact.profileImage ? (
                <Image source={{ uri: contact.profileImage }} style={styles.largeAvatarImg} />
              ) : (
                <View style={styles.largeAvatar}>
                  <Text style={styles.largeAvatarText}>{contact.fullName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
`;

cd = cd.replace(
  `<View style={styles.largeAvatar}>
                  <Text style={styles.largeAvatarText}>{contact.fullName.charAt(0).toUpperCase()}</Text>
                </View>`,
  cdAvatarCode
);

const cdStyles = `
  largeAvatarImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.borderDark,
  },
`;

if (!cd.includes('largeAvatarImg')) {
  cd = cd.replace(
    `  largeAvatar: {`,
    cdStyles + `\n  largeAvatar: {`
  );
}
fs.writeFileSync('StickerSmash/src/components/company-hierarchy/ContactDrawer.tsx', cd);

console.log('Updated avatars everywhere');
