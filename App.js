import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState(null);
  const [foodData, setFoodData] = useState(null);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef(null);

  // If permission is not yet determined.
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permissions...</Text>
      </View>
    );
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


  const recognizeFood = async (photoUri) => {
    const apiKey = 'KEYHEREKEYHERE'; 
    const apiUrl = 'https://api.logmeal.es/v2/image/recognition/dish'; 
    
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('image', {
        uri: photoUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      });
  
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });
  
      const responseText = await response.text();
  
      if (!response.ok) {
        console.error('API Error Response:', responseText);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
  
      const result = JSON.parse(responseText);
      console.log("Food Recognition Result:", result);
      setFoodData(result);
    } catch (error) {
      console.error("Error recognizing food:", error);
    } finally {
      setLoading(false);
    }
  };
  
 
  // Function to take a picture.
  const takePicture = async () => {
  if (cameraRef.current) {
    try {
      let photo = await cameraRef.current.takePictureAsync();
      console.log('Photo taken:', photo);
      setPhotoUri(photo.uri);
      recognizeFood(photo.uri);  // Pass photo URI to the function
    } catch (error) {
      console.error("Error taking picture:", error);
    }
  }
};


return (
  <View style={styles.container}>
    {/* Camera View */}
    <CameraView style={styles.camera} ref={cameraRef} enableTorch={false}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={takePicture}>
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
      </View>
    </CameraView>

    {/* Photo Preview */}
    {photoUri && (
      <View style={styles.previewContainer}>
        <Text>Photo Preview:</Text>
        <Image source={{ uri: photoUri }} style={styles.previewImage} />
      </View>
    )}

    {/* Loading Indicator */}
    {loading && <ActivityIndicator size="large" color="#0000ff" />}

    {/* Scrollable Food Recognition Results */}
    {foodData && (
      <ScrollView style={styles.foodDataContainer} contentContainerStyle={{ paddingBottom: 20 }}>
        <Text style={styles.foodDataTitle}>Food Recognition Result:</Text>

        {/* Display Food Family */}
        {foodData.foodFamily && foodData.foodFamily.length > 0 && (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>Food Family:</Text>
            {foodData.foodFamily.map((item, index) => (
              <Text key={index} style={styles.resultText}>
                {item.name} (Confidence: {(item.prob * 100).toFixed(2)}%)
              </Text>
            ))}
          </View>
        )}

        {/* Display Food Type */}
        {foodData.foodType && foodData.foodType.length > 0 && (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>Food Type:</Text>
            {foodData.foodType.map((item, index) => (
              <Text key={index} style={styles.resultText}>
                {item.name}
              </Text>
            ))}
          </View>
        )}

        {/* Display Additional Info (like Image ID) */}
        {foodData.imageId && (
          <Text style={styles.resultFooter}>Image ID: {foodData.imageId}</Text>
        )}
      </ScrollView>
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
  foodDataContainer: {
    flex: 1,               // Allows the scrollable content to take available space
    margin: 10,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    maxHeight: 300,        // Limits the height to make it scrollable
  },
  foodDataTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultSection: {
    marginBottom: 10,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 5,
  },
  resultText: {
    fontSize: 14,
    color: '#444',
  },
  resultFooter: {
    fontSize: 12,
    color: '#888',
    marginTop: 10,
    fontStyle: 'italic',
  },
  
});
