// File: src/MapComponent.tsx

import React, { useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

// 1. SECURE TOKEN RETRIEVAL
const TOKEN = import.meta.env.VITE_CESIUM_TOKEN;
if (!TOKEN) console.error("🚨 ERROR: Missing Cesium Token in .env file!");
Cesium.Ion.defaultAccessToken = TOKEN || "";

const METRO_COLOR = Cesium.Color.fromCssColorString("#FF0000"); // Red

const MapComponent: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const [isUnderground, setIsUnderground] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Async initialization function to allow 'await' usage
    const initCesium = async () => {
      
      // 1. VIEWER INITIALIZATION
      // We do NOT load Cesium World Terrain here because Google 3D Tiles 
      // already include the terrain/ground mesh.
      const viewer = new Cesium.Viewer(containerRef.current!, {
        baseLayerPicker: false, // Disable map picker to prevent conflicts
        timeline: false,
        animation: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        shadows: true,
        // Use default ellipsoid (smooth sphere) underneath Google Tiles
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      });

      viewerRef.current = viewer;

      // 2. SET CAMERA TO BRUSSELS
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(4.3517, 50.8503, 1500), // 1500m altitude
        orientation: {
          heading: Cesium.Math.toRadians(0.0), // North
          pitch: Cesium.Math.toRadians(-35.0), // Tilted view
          roll: 0.0,
        },
      });

      // 3. LOAD GOOGLE PHOTOREALISTIC 3D TILES (Asset ID 2275207)
      try {
        const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(2275207);
        viewer.scene.primitives.add(tileset);
        console.log("✅ Google 3D Tiles loaded successfully!");
      } catch (e) {
        console.error("❌ Error loading Google 3D Tiles", e);
      }

      // 4. LOAD METRO DATA (GeoJSON)
      fetch("/metro.geojson")
        .then((res) => res.json())
        .then((data) => {
          data.features.forEach((feature: any) => {
            const segments = getSegments(feature.geometry);
            
            // Iterate over segments to handle MultiLineStrings
            segments.forEach((segCoords: any[]) => {
              // Flatten coordinates to [lon, lat, lon, lat...]
              const flatCoords = segCoords.map((pt) => [pt[0], pt[1]]).flat();
              
              viewer.entities.add({
                name: feature.properties?.NOM || "Metro Line",
                corridor: {
                  positions: Cesium.Cartesian3.fromDegreesArray(flatCoords),
                  width: 15.0,
                  
                  // ALTITUDE ADJUSTMENT:
                  // Brussels streets are at approx ~60m altitude.
                  // We draw the metro at 30m absolute altitude so it sits
                  // roughly 30m below the street surface.
                  height: 30.0, 
                  extrudedHeight: 20.0, // Tunnel is 10m tall (30m to 20m)
                  
                  material: METRO_COLOR,
                  outline: true,
                  outlineColor: Cesium.Color.WHITE
                }
              });
            });
          });
        });
    };

    initCesium();

    // Cleanup on unmount
    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
      }
    };
  }, []);

  // HANDLE TRANSPARENCY & X-RAY MODE
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const scene = viewer.scene;
    const globe = scene.globe;

    // Enable Globe Transparencies
    globe.translucency.enabled = true;
    globe.translucency.frontFaceAlphaByDistance = new Cesium.NearFarScalar(
      100.0, isUnderground ? 0.2 : 1.0, 100000.0, 1.0
    );

    // Allow camera to go underground
    scene.screenSpaceCameraController.enableCollisionDetection = true;
    globe.depthTestAgainstTerrain = true;

    // UPDATE GOOGLE TILES OPACITY DYNAMICALLY
    const primitives = viewer.scene.primitives;
    for (let i = 0; i < primitives.length; i++) {
        const prim = primitives.get(i);
        if (prim instanceof Cesium.Cesium3DTileset) {
            prim.style = new Cesium.Cesium3DTileStyle({
                // Underground: 0.1 Opacity (Ghost mode) | Surface: 1.0 (Opaque)
                color: isUnderground ? "color('white', 0.1)" : "color('white', 1.0)"
            });
        }
    }
  }, [isUnderground]);

  // Helper to parse GeoJSON geometry types
  const getSegments = (geometry: any) => {
    if (geometry.type === "LineString") return [geometry.coordinates];
    if (geometry.type === "MultiLineString") return geometry.coordinates;
    return [];
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}>
      {/* CESIUM CONTAINER */}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* MODERN UI OVERLAY */}
      <div style={{
          position: "absolute", 
          top: 20, 
          right: 20,
          background: "rgba(15, 23, 42, 0.85)", // Dark Blue/Slate transparent
          backdropFilter: "blur(12px)",         // Glassmorphism effect
          padding: "20px",
          borderRadius: "16px",
          color: "white",
          fontFamily: "'Segoe UI', Roboto, Helvetica, sans-serif",
          zIndex: 100,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          width: "300px",
          border: "1px solid rgba(255, 255, 255, 0.1)"
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
          <span style={{ fontSize: "28px", marginRight: "12px" }}>🚇</span>
          <div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", letterSpacing: "-0.5px" }}>Brussels Underground</h3>
            <span style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px" }}>Google 3D Tiles</span>
          </div>
        </div>
        
        {/* Description */}
        <div style={{ marginBottom: "20px", fontSize: "13px", lineHeight: "1.6", color: "#cbd5e1" }}>
          {isUnderground 
            ? "👁️ X-Ray Mode Active. The city surface is transparent to reveal the infrastructure."
            : "🏙️ Photorealistic Mode. Standard exploration with Google Earth data."}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsUnderground(!isUnderground)}
          style={{
            background: isUnderground 
                ? "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)" // Cyan/Blue Gradient
                : "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)", // Red/Pink Gradient
            color: "white",
            border: "none",
            padding: "14px 0",
            width: "100%",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "700",
            fontSize: "14px",
            letterSpacing: "0.5px",
            transition: "transform 0.2s, box-shadow 0.2s",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
          {isUnderground ? "Back to Surface" : "Explore Underground"}
        </button>
      </div>
    </div>
  );
};

export default MapComponent;