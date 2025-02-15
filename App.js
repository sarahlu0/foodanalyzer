import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, Image, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { CameraView, useCameraPerms } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import * as MediaLibrary from 'expo-media-library';  

export default function App() {
  const [perm, requestPerm] = useCameraPerms();
  const [mediaPerm, setMediaPerm] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const [isModalVis, setModalVis] = useState(false);
  const [foodData, setFoodData] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef(null);

  // Request media library perm on component mount
  const requestMediaPerm = async () => {
    const { status } = await MediaLibrary.requestPermsAsync();
    if (status === "granted") {
      setMediaPerm(true);
    } else {
      Alert.alert(
        "Permission Denied",
        "Please provide camera roll access to save images."
      );
    }
  };

  // Request media library perm once
  useState(() => {
    requestMediaPerm();
  }, []);

  if (!perm) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera perms...</Text>
      </View>
    );
  }

  //display settings
  const displayFull = () => {
    setModalVis(true);
  };

  const hideFullImage = () => {
    setModalVis(false);
  };

  if (!perm.granted) {
    return (
      <View style={styles.container}>
        <Text>No access to camera</Text>
        <TouchableOpacity onPress={requestPerm} style={styles.button}>
          <Text style={styles.buttonText}>Grant Perm</Text>
        </TouchableOpacity>
      </View>
    );
  }
  // Function to recognize food using LogMeal API.
  const recognizeFood = async (photoUri) => {
    const apiKey = ""; // Replace with your LogMeal API key.
    const apiUrl = "https://api.logmeal.es/v2/image/recognition/dish";

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("image", {
        uri: photoUri,  
        type: "image/jpeg",
        name: "photo.jpg",
      });

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error("API Error Response:", responseText);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = JSON.parse(responseText);
      console.log("Food Recognition Result:", result);
      setFoodData(result);

      // Use recognition_results for dish info.
      if (result.recognition_results && result.recognition_results.length > 0) {
        const topDish = result.recognition_results[0];
        // Call Calorie Ninja API using the top dish name.
        fetchCalorieNinjaNutrition(topDish.name);
      }
    } catch (error) {
      console.error("Error recognizing food:", error);
    } finally {
      setLoading(false);
    }
  };

  // New function to fetch nutrition data from Calorie Ninja using fetch.
  const fetchCalorieNinjaNutrition = async (dishName) => {
    const url = `https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(
      dishName
    )}`;
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-Api-Key": "", // Replace with your Calorie Ninja API key.
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Calorie Ninja API Error: ${response.status} ${errorText}`
        );
      }
      const data = await response.json();
      console.log("Calorie Ninja Nutrition:", data);
      setNutritionData(data);
    } catch (error) {
      console.error("Error fetching nutrition data from Calorie Ninja:", error);
    }
  };

  //function to take pic
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        let photo = await cameraRef.current.takePictureAsync();
        console.log("Photo taken:", photo);
        setPhotoUri(photo.uri);
        // Reset previous data
        setFoodData(null);
        setNutritionData(null);
        recognizeFood(photo.uri);
      } catch (error) {
        console.error("Error taking picture:", error);
      }
    }
  };

  // function save pic
  const saveToCameraRoll = async () => {
    if (photoUri && mediaPerm) {
      try {
        const asset = await MediaLibrary.createAssetAsync(photoUri); // Save image to gallery
        Alert.alert("Saved!", "Image has been saved to your camera roll :)");
      } catch (error) {
        console.error("Error saving image:", error);
        Alert.alert("Error", "Could not save the image to the camera roll.");
      }
    } else {
      Alert.alert(
        "Perm Denied",
        "You need to grant camera roll access to save the image."
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* camera View */}
      <CameraView style={styles.camera} ref={cameraRef}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={takePicture}>
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>
        </View>
      </CameraView>

      {/* show preview */}
      {photoUri && (
        <View style={styles.previewContainer}>
          <Text style ={styles.infoText}>Photo Preview:</Text>
          <TouchableOpacity style={{ width: '100%', height: '100%' }} onPress={displayFull}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
          </TouchableOpacity>
        </View>
      )}

      {/* Loading Indicator */}
      {loading && <ActivityIndicator size="large" color="#0000ff" />}

      {/* Show Full-Size Image Modal */}
      <Modal
        visible={isModalVis}
        transparent={true}
        animationType="fade"
        onRequestClose={hideFullImage}
      >
        <View style={styles.modalContainer}>
          {/* Full-size Image */}
          <TouchableOpacity
            style={styles.imageTouchable}
            onPress={hideFullImage}
          >
            <Image source={{ uri: photoUri }} style={styles.fullImage} />
          </TouchableOpacity>

          {/* Floating Button */}
          <View style={styles.floatingButtonContainer}>
            <TouchableOpacity style={styles.button} onPress={saveToCameraRoll}>
              <Text style={styles.buttonText}>Save to Camera Roll</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* scrollable food results */}
      {foodData && (
        <ScrollView
          style={styles.foodDataContainer}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <Text style={styles.foodDataTitle}>Food Recognition Result:</Text>

        {/* display recognized: lim top 3 */}
        {foodData.recognition_results && foodData.recognition_results.length > 0 && (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>Top 3 Dishes:</Text>
            {foodData.recognition_results.slice(0, 3).map((dish, index) => (
              <Text key={index} style={styles.resultText}>
                {dish.name} (Confidence: {(dish.prob * 100).toFixed(1)}%)
              </Text>
            ))}
          </View>
        )}


        {foodData.imageId && (
          <Text style={styles.resultFooter}>Image ID: {foodData.imageId}</Text>
        )}
      </ScrollView>
    )}

    {/* Scrollable Nutritional Information */}
    {nutritionData && (
      <ScrollView style={styles.nutritionDataContainer} contentContainerStyle={{ paddingBottom: 20 }}>
        <Text style={styles.foodDataTitle}>Nutritional Information:</Text>
        {nutritionData.items && nutritionData.items.map((item, index) => (
          <Text key={index} style={styles.resultText}>
            {item.name}: {item.calories} calories, {item.protein}g protein, {item.fat}g fat, {item.carbohydrates}g carbs
          </Text>
        ))}
      </ScrollView>
    )}


      <StatusBar style="auto" />
    </View>
  );
}

// styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  camera: {
    flex: 2,
    width: "100%",
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: "transparent",
    flexDirection: "row",
    margin: 20,
    alignItems: "flex-end",
  },
  button: {
    backgroundColor: "#E6E6FA",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },

  previewContainer: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 20,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Slight transparency
    borderRadius: 10
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    padding: 10,
  },

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },

  imageTouchable: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },

  fullImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },

  floatingButtonContainer: {
    position: "absolute", // fix container location
    bottom: 40, 
    alignSelf: "center", 
    backgroundColor: "rgba(255, 255, 255, 0.8)", 
    padding: 5,
    borderRadius: 10,
    elevation: 5,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#660066',
  },

  infoText: {
    fontSize: 16,
    fontFamily: 'Graphik Light',
    color: '#660066',
  },

  foodDataContainer: {
    flex: 1,
    margin: 10,
    padding: 20,
    backgroundColor: '#E6E6FA',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    maxHeight: 300,
  },
  nutritionDataContainer: {
    flex: 1,
    margin: 10,
    padding: 15,
    backgroundColor: '#E6E6FA',
    borderRadius: 10,
    borderColor: '#660066',
  },
  foodDataTitle: {
    fontSize: 20,
    fontFamily: 'Graphik Light',
    fontWeight: 'bold',
    marginBottom: 10,
    color: "#333",
  },
  resultSection: {
    marginBottom: 10,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
    marginBottom: 5,
  },
  resultText: {
    fontSize: 14,
    color: "#444",
  },
  resultFooter: {
    fontSize: 12,
    color: "#888",
    marginTop: 10,
    fontStyle: "italic",
  },
});
