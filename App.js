import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, Image, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';  

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, setMediaPermission] = useState(false);  
  const [photoUri, setPhotoUri] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const cameraRef = useRef(null);

  // Request media library permission on component mount
  const requestMediaPermission = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === 'granted') {
      setMediaPermission(true);
    } else {
      Alert.alert('Permission Denied', 'Camera roll access is required to save images.');
    }
  };

  // Request media library permission once
  useState(() => {
    requestMediaPermission();
  }, []);

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
  
  // function for pic
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

  // function save pic
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
          <TouchableOpacity style={{ width: '100%', height: '100%' }} onPress={displayFull}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
          </TouchableOpacity>
        </View>
      )}

      {/* show full */}
      {/* show full */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={hideFullSizeImage}
      >
        <View style={styles.modalContainer}>
          {/* Full-size Image */}
          <TouchableOpacity style={styles.imageTouchable} onPress={hideFullSizeImage}>
            <Image source={{ uri: photoUri }} style={styles.fullSizeImage} />
          </TouchableOpacity>

          {/* Floating Buttons */}
          <View style={styles.floatingButtonContainer}>
            <TouchableOpacity style={styles.button} onPress={saveToCameraRoll}>
              <Text style={styles.buttonText}>Save to Camera Roll</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      <StatusBar style="auto" />
    </View>
  );
}

// Basic styles
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
    backgroundColor: '#E6E6FA',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
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
  
  imageTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  
  fullSizeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  
  floatingButtonContainer: {
    position: 'absolute', // Ensures it floats over the image
    bottom: 40, // Adjust for visibility
    alignSelf: 'center', // Center button horizontally
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Slight transparency
    padding: 5,
    borderRadius: 10,
    elevation: 5,
  },
  
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  
});
