import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState(null);
  const cameraRef = useRef(null);

  // If permission is not yet determined.
  if (!permission) {
    return <View style={styles.container}><Text>Requesting camera permissions...</Text></View>;
  }

  // If permission is denied.
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text>No access to camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Function to take a picture.
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        let photo = await cameraRef.current.takePictureAsync();
        console.log('Photo taken:', photo);
        setPhotoUri(photo.uri);
      } catch (error) {
        console.error("Error taking picture:", error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        ref={cameraRef} 
        enableTorch={false} // Optional: Enable flashlight
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={takePicture}>
            <Text style={styles.buttonText}>SNAP</Text>
          </TouchableOpacity>
        </View>
      </CameraView>

      {/* Display the captured photo (if any) */}
      {photoUri && (
        <View style={styles.previewContainer}>
          <Text>Photo Preview:</Text>
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
        </View>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

// Basic styles for the app.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  camera: {
    flex: 2,
    width: '100%',
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    margin: 20,
    alignItems: 'flex-end',
  },
  button: {
    flex: 0.3,
    alignSelf: 'flex-end',
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    color: '#000',
  },
  previewContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});
