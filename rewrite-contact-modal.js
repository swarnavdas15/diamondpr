import fs from 'fs';

let content = fs.readFileSync('StickerSmash/src/components/company-hierarchy/ContactFormModal.tsx', 'utf-8');

// Ensure Image and ImagePicker are imported
if (!content.includes('ImagePicker')) {
  content = content.replace(
    `import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';`,
    `import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, StyleSheet, useWindowDimensions, Image } from 'react-native';\nimport * as ImagePicker from 'expo-image-picker';\nimport { useERP } from '../../context/ERPContext';`
  );
}

// Add state and context
if (!content.includes('profileImageUri')) {
  content = content.replace(
    `const [error, setError] = useState('');`,
    `const [error, setError] = useState('');\n  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);\n  const { uploadCompanyContactProfileImage } = useERP();`
  );

  content = content.replace(
    `const resetForm = () => {`,
    `const resetForm = () => {\n    setProfileImageUri(null);`
  );
}

// Add image picker logic
if (!content.includes('pickImage')) {
  const pickerLogic = `
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setProfileImageUri(result.assets[0].uri);
    }
  };
  `;
  content = content.replace(`const resetForm = () => {`, pickerLogic + `\n  const resetForm = () => {`);
}

// Update form submit
content = content.replace(
  `onSubmit(data);`,
  `// In case onSubmit is a promise now
      const result = await Promise.resolve(onSubmit(data));
      if (profileImageUri) {
        // since we don't have the returned ID directly if it's sync, wait, onSubmit in ERPContext returns Promise<CompanyContact>
        const contactId = (result as any)?.id || (contactToEdit?.id);
        if (contactId) {
          const filename = profileImageUri.split('/').pop() || 'profile.jpg';
          const match = /\\.(\\w+)$/.exec(filename);
          const type = match ? \`image/\${match[1]}\` : \`image/jpeg\`;
          await uploadCompanyContactProfileImage(contactId, profileImageUri, filename, type);
        }
      }`
);

// Update handleSubmit to be async
content = content.replace(`const handleSubmit = () => {`, `const handleSubmit = async () => {`);

// Add UI
const imagePickerUI = `
            <Text style={styles.label}>Contact Profile Image</Text>
            <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
              {profileImageUri || (contactToEdit?.profileImage) ? (
                <Image source={{ uri: profileImageUri || contactToEdit?.profileImage }} style={styles.previewImage} />
              ) : (
                <Text style={styles.imagePickerText}>+ Select Image</Text>
              )}
            </TouchableOpacity>
`;

content = content.replace(
  `<Text style={styles.label}>Full Name *</Text>`,
  imagePickerUI + `\n            <Text style={styles.label}>Full Name *</Text>`
);

// Add styles
const newStyles = `
  imagePickerBtn: {
    backgroundColor: Colors.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderStyle: 'dashed',
    height: 100,
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePickerText: {
    color: Colors.accentTeal,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
`;

if (!content.includes('imagePickerBtn')) {
  content = content.replace(
    `  submitBtn: {`,
    newStyles + `\n  submitBtn: {`
  );
}

fs.writeFileSync('StickerSmash/src/components/company-hierarchy/ContactFormModal.tsx', content);
console.log('Updated ContactFormModal.tsx');
