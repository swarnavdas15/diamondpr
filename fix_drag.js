const fs = require('fs');

function processFile(file) {
  let data = fs.readFileSync(file, 'utf8');
  if (!data.includes('const [isDragging, setIsDragging] = useState(false);')) {
    data = data.replace("const [error, setError] = useState('');", "const [error, setError] = useState('');\n  const [isDragging, setIsDragging] = useState(false);");
  }

  if (!data.includes('onDragEnter={(e: any) =>')) {
    data = data.replace('<TouchableOpacity style={[styles.backdrop', '<View\n        // @ts-ignore\n        onDragEnter={(e: any) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}\n        style={{ flex: 1 }}\n      >\n        <TouchableOpacity style={[styles.backdrop');
    data = data.replace('</TouchableOpacity>\n    </Modal>', '</TouchableOpacity>\n      </View>\n    </Modal>');
  }

  if (!data.includes('position: \'absolute\'')) {
    data = data.replace('onPress={(e) => e.stopPropagation()}>', 'onPress={(e) => e.stopPropagation()}>\n          {Platform.OS === \'web\' && isDragging && (\n            <View\n              // @ts-ignore\n              onDragOver={(e: any) => { e.preventDefault(); e.stopPropagation(); }}\n              onDragLeave={(e: any) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}\n              onDrop={(e: any) => {\n                e.preventDefault();\n                e.stopPropagation();\n                setIsDragging(false);\n                handleClose();\n                handleFileUpload(e);\n              }}\n              style={{\n                position: \'absolute\',\n                top: 0, left: 0, right: 0, bottom: 0,\n                backgroundColor: \'rgba(2, 132, 199, 0.95)\',\n                zIndex: 9999,\n                alignItems: \'center\',\n                justifyContent: \'center\',\n                borderWidth: 4,\n                borderColor: \'#fff\',\n                borderStyle: \'dashed\',\n                borderRadius: 12\n              }}\n            >\n              <Text style={{ color: \'#fff\',\n                fontSize: 32, fontWeight: \'bold\' }}>Drop Excel File Here</Text>\n              <Text style={{ color: \'#bae6fd\',\n                fontSize: 16, marginTop: 12 }}>Release to immediately parse & close</Text>\n            </View>\n          )}');
  }

  fs.writeFileSync(file, data);
}

processFile('StickerSmash/src/components/CreateOrderModal.tsx');
