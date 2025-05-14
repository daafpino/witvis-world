import React, { useEffect, useState, useCallback } from "react";
import "./App.css";
import { ReactComponent as ArrowLeft } from "./assets/ArrowLeft.svg";
import { ReactComponent as ArrowRight } from "./assets/ArrowRight.svg";
import visDefault from "./assets/vis.svg";
import visHover from "./assets/vis-hover.svg";
import supabase from "./supabaseClient";

const defaultLocations = [
  "Amsterdam", "Tokyo", "New York", "Berlin", "Paris",
  "Svalbard", "Barcelona", "Cape Town", "Lisbon",
  "Reykjavík", "Seoul", "Sydney", "Cairo", "Mexico City", "Oslo"
];

function App() {
  const [customTheme, setCustomTheme] = useState("vibe");
  const [customLocation, setCustomLocation] = useState("Svalbard");
  const [termsOpen, setTermsOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [fishHover, setFishHover] = useState(false);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const currentTheme = customTheme.trim();
  const currentLocation = customLocation.trim();

  const handleRandomLocation = () => {
    const randomIndex = Math.floor(Math.random() * defaultLocations.length);
    setCustomLocation(defaultLocations[randomIndex]);
  };

  const fetchImages = useCallback(async () => {
    const query = `${currentTheme}, ${currentLocation}`;

    try {
      const { data: customImages, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("approved", true)
        .ilike("tags", `%${currentTheme}%`)
        .ilike("location", `%${currentLocation}%`)
        .limit(10);

      if (error) throw error;

      if (customImages.length > 0) {
        const formatted = customImages.map((img) => ({
          url: img.imageUrl,
          photographer: img.username || "Anonymous",
          profileUrl: null,
          source: "Hitvis"
        }));

        setImages(formatted);
        setCurrentImageIndex(0);
        return;
      }
    } catch (e) {
      console.warn("No Supabase match or error:", e.message);
    }

    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&client_id=${process.env.REACT_APP_UNSPLASH_ACCESS_KEY}`
      );
      if (!response.ok) throw new Error("Unsplash failed");

      const data = await response.json();
      const fetchedImages = data.results.map(img => ({
        url: img.urls?.regular || "",
        photographer: img.user?.name || "Unknown",
        profileUrl: img.user?.links?.html || null,
        source: "Unsplash"
      }));

      if (fetchedImages.length > 0) {
        setImages(fetchedImages);
        setCurrentImageIndex(0);
        return;
      }
    } catch (error) {
      console.error("Unsplash failed, trying Pexels...");
    }

    try {
      const pexelsResponse = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10`,
        {
          headers: {
            Authorization: process.env.REACT_APP_PEXELS_API_KEY
          }
        }
      );
      const pexelsData = await pexelsResponse.json();
      const pexelsPhotos = pexelsData.photos.map(photo => ({
        url: photo.src?.landscape || "",
        photographer: photo.photographer || "Unknown",
        profileUrl: photo.photographer_url || null,
        source: "Pexels"
      }));

      if (pexelsPhotos.length > 0) {
        setImages(pexelsPhotos);
        setCurrentImageIndex(0);
      }
    } catch (pexelsError) {
      console.error("Failed to fetch images from Pexels too", pexelsError);
    }
  }, [currentTheme, currentLocation]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleNextManual = useCallback(() => {
    if (images.length === 0) return;
    setTransitioning(true);
    setTimeout(() => {
      const nextIndex = (currentImageIndex + 1) % images.length;
      setCurrentImageIndex(nextIndex);
      setTransitioning(false);
    }, 500);
  }, [images, currentImageIndex]);

  const handlePreviousManual = useCallback(() => {
    if (images.length === 0) return;
    setTransitioning(true);
    setTimeout(() => {
      const prevIndex = (currentImageIndex - 1 + images.length) % images.length;
      setCurrentImageIndex(prevIndex);
      setTransitioning(false);
    }, 500);
  }, [images, currentImageIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      handleNextManual();
    }, 8000);
    return () => clearInterval(interval);
  }, [handleNextManual]);

  const handleUpload = async (e) => {
    e.preventDefault();
    const form = e.target;
    const file = form.image.files[0];

    if (!file) {
      alert('Please select an image.');
      return;
    }

    const toBase64 = file => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
    });

    const fileBase64 = await toBase64(file);

    const payload = {
      fileBase64,
      fileName: file.name,
      username: form.username.value,
      email: form.email.value,
      tags: form.tags.value,
      location: form.location.value,
    };

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (result.success) {
        alert("Your photo is being reviewed. If approved, it will appear on hitvis.com and we'll let you know.");
        form.reset();
        setSubmitOpen(false);
      } else {
        alert('Upload failed: ' + result.error);
      }

    } catch (error) {
      console.error(error);
      alert('Something went wrong.');
    }
  };

  return (
    <div className="App">
      {/* ... existing JSX unchanged ... */}
    </div>
  );
}

export default App;
