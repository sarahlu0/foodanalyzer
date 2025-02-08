import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, Image, Alert } from 'react-native';
import { CameraView, useCameraPermissions, CameraType} from 'expo-camera';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const cameraRef = useRef(null);

  // If permission is not yet determined.
  if (!permission) {
    return <View style={styles.container}><Text>Requesting camera permissions...</Text></View>;
  }
  //display settings
  const displayFull = () => {
    setModalVisible(true);
  };


  const hideFullSizeImage = () => {
    setModalVisible(false);
  };

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

  // Function to save the image to camera roll
  const saveToCameraRoll = async () => {
    if (photoUri && mediaPermission) {
      try {
        const asset = await MediaLibrary.createAssetAsync(photoUri);  // Save image to gallery
        await MediaLibrary.createAlbumAsync('MyApp Photos', asset, false);  // Save in album 'MyApp Photos'
        Alert.alert('Saved!', 'Image has been saved to your camera roll!');
      } catch (error) {
        console.error('Error saving image:', error);
        Alert.alert('Error', 'Could not save the image to the camera roll.');
      }
    } else {
      Alert.alert('Permission Denied', 'You need to grant camera roll access to save the image.');
    }
  };

  // analyze image
  const analyzeImage = () => {
    Alert.alert('Analyze', 'Analyze the image functionality is not implemented yet.');
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        ref={cameraRef}
        enableTorch={false} 
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={takePicture}>
            <Text style={styles.buttonText}>SNAP</Text>
          </TouchableOpacity>
        </View>
      </CameraView>

      {/* show preview */}
      {photoUri && (
        <View style={styles.previewContainer}>
          <Text>Photo Preview:</Text>
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
        </View>
      )}

      {/* show full */}
      <Modal
        visible={isModalVisible}
        transparent={true} // Makes the background opaque
        animationType="fade"
        onRequestClose={hideFullSizeImage} // Close on hardware back press
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={{ width: '100%', height: '100%' }} onPress={hideFullSizeImage}>
            <Image source={{ uri: photoUri }} style={styles.fullSizeImage} />
          </TouchableOpacity>

          {/* save or analyze */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={saveToCameraRoll}>
              <Text style={styles.buttonText}>Save to Camera Roll</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={analyzeImage}>
              <Text style={styles.buttonText}>Analyze Image</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  fullSizeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain', 
  },
});
