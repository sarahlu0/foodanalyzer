import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, setMediaPermission] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [foodData, setFoodData] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef(null);

  // Request media library permission on component mount
  const requestMediaPermission = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === "granted") {
      setMediaPermission(true);
    } else {
      Alert.alert(
        "Permission Denied",
        "Camera roll access is required to save images."
      );
    }
  };

  // Request media library permission once
  useState(() => {
    requestMediaPermission();
  }, []);

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permissions...</Text>
      </View>
    );
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
  // Function to recognize food using LogMeal API.
  const recognizeFood = async (photoUri) => {
    const apiKey = "LOG_MEAL_API_KEY"; // Replace with your LogMeal API key.
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
          "X-Api-Key": "CALORIE_NINJA_KEY", // Replace with your Calorie Ninja API key.
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
        // Reset previous data.
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
    if (photoUri && mediaPermission) {
      try {
        const asset = await MediaLibrary.createAssetAsync(photoUri); // Save image to gallery
        await MediaLibrary.createAlbumAsync("MyApp Photos", asset, false); // Save in album 'MyApp Photos'
        Alert.alert("Saved!", "Image has been saved to your camera roll!");
      } catch (error) {
        console.error("Error saving image:", error);
        Alert.alert("Error", "Could not save the image to the camera roll.");
      }
    } else {
      Alert.alert(
        "Permission Denied",
        "You need to grant camera roll access to save the image."
      );
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

      {/* show preview */}
      {photoUri && (
        <View style={styles.previewContainer}>
          <Text>Photo Preview:</Text>
          <TouchableOpacity
            style={{ width: "100%", height: "100%" }}
            onPress={displayFull}
          >
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
          </TouchableOpacity>
        </View>
      )}

      {/* Loading Indicator */}
      {loading && <ActivityIndicator size="large" color="#0000ff" />}

      {/* Show Full-Size Image Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={hideFullSizeImage}
      >
        <View style={styles.modalContainer}>
          {/* Full-size Image */}
          <TouchableOpacity
            style={styles.imageTouchable}
            onPress={hideFullSizeImage}
          >
            <Image source={{ uri: photoUri }} style={styles.fullSizeImage} />
          </TouchableOpacity>

          {/* Floating Button */}
          <View style={styles.floatingButtonContainer}>
            <TouchableOpacity style={styles.button} onPress={saveToCameraRoll}>
              <Text style={styles.buttonText}>Save to Camera Roll</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Scrollable Food Recognition Results */}
      {foodData && (
        <ScrollView
          style={styles.foodDataContainer}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <Text style={styles.foodDataTitle}>Food Recognition Result:</Text>

          {/* Display recognized dishes */}
          {foodData.recognition_results &&
            foodData.recognition_results.length > 0 && (
              <View style={styles.resultSection}>
                <Text style={styles.resultTitle}>Dishes:</Text>
                {foodData.recognition_results.map((dish, index) => (
                  <Text key={index} style={styles.resultText}>
                    {dish.name} (Confidence: {(dish.prob * 100).toFixed(2)}%)
                  </Text>
                ))}
              </View>
            )}

          {foodData.imageId && (
            <Text style={styles.resultFooter}>
              Image ID: {foodData.imageId}
            </Text>
          )}
        </ScrollView>
      )}

      {/* Scrollable Nutritional Information */}
      {nutritionData && (
        <ScrollView
          style={styles.nutritionDataContainer}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <Text style={styles.foodDataTitle}>Nutritional Information:</Text>
          {nutritionData.items &&
            nutritionData.items.map((item, index) => (
              <Text key={index} style={styles.resultText}>
                {item.name}: {item.calories} calories, {item.protein}g protein,{" "}
                {item.fat}g fat, {item.carbohydrates}g carbs
              </Text>
            ))}
        </ScrollView>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

// Basic styles
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
  buttonText: {
    fontSize: 18,
    color: "#000",
  },
  previewContainer: {
    flex: 1,
    alignItems: "center",
    padding: 10,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
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

  fullSizeImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },

  floatingButtonContainer: {
    position: "absolute", // Ensures it floats over the image
    bottom: 40, // Adjust for visibility
    alignSelf: "center", // Center button horizontally
    backgroundColor: "rgba(255, 255, 255, 0.8)", // Slight transparency
    padding: 5,
    borderRadius: 10,
    elevation: 5,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },

  foodDataContainer: {
    flex: 1,
    margin: 10,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    shadowColor: "#000",
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
    backgroundColor: "#e9f9e9",
    borderRadius: 10,
  },
  foodDataTitle: {
    fontSize: 20,
    fontWeight: "bold",
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
