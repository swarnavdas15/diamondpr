import fs from 'fs';

let content = fs.readFileSync('StickerSmash/src/components/CreateClientModal.tsx', 'utf-8');

// Imports
content = content.replace(
  `import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';`,
  `import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, ScrollView, useWindowDimensions, Image } from 'react-native';\nimport * as ImagePicker from 'expo-image-picker';`
);

// State & Context
content = content.replace(
  `const { clients, createClient } = useERP();`,
  `const { clients, createClient, uploadClientProfileImage } = useERP();`
);
content = content.replace(
  `const [successMsg, setSuccessMsg] = useState('');`,
  `const [successMsg, setSuccessMsg] = useState('');\n  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);`
);

// Image Picker Function
const imagePickerFn = `
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

content = content.replace(
  `const handleSubmit = () => {`,
  imagePickerFn + `\n  const handleSubmit = async () => {`
);

// Update handleSubmit to async and add upload logic
content = content.replace(
  `const newClient = createClient({`,
  `const newClient = await createClient({`
);

content = content.replace(
  `      if (onClientCreated) {
        onClientCreated(newClient);
      }

      setSuccessMsg('Client Registered Successfully');`,
  `      if (profileImageUri) {
        setSuccessMsg('Uploading profile image...');
        const filename = profileImageUri.split('/').pop() || 'profile.jpg';
        // Infer type from extension
        const match = /\\.(\\w+)$/.exec(filename);
        const type = match ? \`image/\${match[1]}\` : \`image/jpeg\`;
        await uploadClientProfileImage(newClient.id, profileImageUri, filename, type);
      }

      if (onClientCreated) {
        onClientCreated(newClient);
      }

      setSuccessMsg('Client Registered Successfully');`
);

// Reset state
content = content.replace(
  `setError('');
    setSuccessMsg('');
    onClose();`,
  `setError('');
    setSuccessMsg('');
    setProfileImageUri(null);
    onClose();`
);

// UI additions
const imagePickerUI = `
              <Text style={styles.label}>Contact Profile Image</Text>
              <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                {profileImageUri ? (
                  <Image source={{ uri: profileImageUri }} style={styles.previewImage} />
                ) : (
                  <Text style={styles.imagePickerText}>+ Select Image</Text>
                )}
              </TouchableOpacity>
`;

content = content.replace(
  `<Text style={styles.label}>Contact Person Name</Text>`,
  imagePickerUI + `\n              <Text style={styles.label}>Contact Person Name</Text>`
);

// Styles
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

content = content.replace(
  `  submitBtn: {`,
  newStyles + `\n  submitBtn: {`
);

fs.writeFileSync('StickerSmash/src/components/CreateClientModal.tsx', content);
console.log('Updated CreateClientModal.tsx');
