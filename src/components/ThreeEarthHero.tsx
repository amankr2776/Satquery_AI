import React, { useEffect, useRef, useState, Component, ErrorInfo, ReactNode } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// 1. Error Boundary Component for the 3D Globe
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorKey: number;
}

class GlobeErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorKey: 0 };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true, errorKey: Date.now() };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Globe Rendering Error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorKey: this.state.errorKey + 1 });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-slate-900/80 backdrop-blur-sm p-6 text-center">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Globe Rendering Error</h2>
            <p className="text-slate-400 mb-6">
              The 3D environment encountered a problem. You can try to reset the view to recover.
            </p>
            <button
              onClick={this.handleReset}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors shadow-lg active:scale-95"
            >
              Reset View
            </button>
          </div>
        </div>
      );
    }

    return <React.Fragment key={this.state.errorKey}>{this.props.children}</React.Fragment>;
  }
}

const ThreeEarthHeroContent: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStation, setActiveStation] = useState<any | null>(null);
  const [hoveredSatellite, setHoveredSatellite] = useState<any | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    
    // 2. Camera Setup - Standard unit space for simplified rendering (radius = 4)
    // Initialize with safe fallback, ResizeObserver will immediately update to exact container bounds
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 0, 11);

    // 3. Renderer Setup with Alpha (for page background seamless integration)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Force absolute layout so it can NEVER stretch, shift, or overflow parent div
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    
    containerRef.current.appendChild(renderer.domElement);

    // 4. Lights - Position light directly from camera perspective to fully illuminate Earth face
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.6);
    sunLight.position.set(5, 5, 12); // Shines directly from viewer/camera perspective
    scene.add(sunLight);

    // 5. Earth Globe and Textures Loader
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';

    // Group to hold all rotating elements
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const earthRadius = 4;
    const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);

    // High fidelity maps from UNPKG CDN (Three-Globe Assets)
    const earthMap = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
    const earthBumpMap = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-topology.png');

    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthMap,
      bumpMap: earthBumpMap,
      bumpScale: 0.12,
      roughness: 0.5,
      metalness: 0.1,
    });

    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    globeGroup.add(earthMesh);

    // Atmospheric Glow Mesh - Standard compliant GLSL shader values to ensure robust rendering on all devices
    const atmosphereGeometry = new THREE.SphereGeometry(earthRadius * 1.05, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
          gl_FragColor = vec4(0.35, 0.7, 1.0, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    globeGroup.add(atmosphereMesh);

    // 6. Interactive Ground Station Hotspots
    const stations = [
      { name: 'ISRO - Satish Dhawan Space Centre', lat: 13.72, lon: 80.23, desc: 'Primary spaceport of the Indian Space Research Organisation (ISRO).' },
      { name: 'Copernicus - ESA Hub', lat: 48.85, lon: 2.35, desc: 'European Space Agency operations hub for Sentinel satellite fleet monitoring.' },
      { name: 'NASA - Kennedy Space Center', lat: 28.57, lon: -80.64, desc: 'Primary launch center for NASA and space shuttle operations.' }
    ];

    const latLonToVector3 = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -(radius * Math.sin(phi) * Math.sin(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.cos(theta)
      );
    };

    const hotspots: THREE.Mesh[] = [];
    stations.forEach(station => {
      const pos = latLonToVector3(station.lat, station.lon, earthRadius + 0.05);
      const hotspotGeo = new THREE.SphereGeometry(0.12, 16, 16);
      
      const hotspotMat = new THREE.MeshBasicMaterial({ 
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.95
      });
      const mesh = new THREE.Mesh(hotspotGeo, hotspotMat);
      mesh.position.copy(pos);
      mesh.userData = { ...station };
      
      const ringGeo = new THREE.RingGeometry(0.16, 0.22, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.lookAt(pos.clone().multiplyScalar(1.5));
      mesh.add(ring);

      globeGroup.add(mesh);
      hotspots.push(mesh);
    });

    // 6.5 Animated Satellites & Orbital Paths Setup
    // 3 orbits, 4 real satellites with detailed telemetry metadata
    const orbitPaths = [
      { id: 'low', name: 'Low Earth Orbit (LEO)', radius: 5.2, inclination: 0.38, color: 0x38bdf8 },
      { id: 'mid', name: 'Medium Earth Orbit (MEO)', radius: 6.1, inclination: 0.78, color: 0xfacc15 },
      { id: 'polar', name: 'High Polar Orbit (HPO)', radius: 7.0, inclination: 1.54, color: 0x34d399 }
    ];

    const satellites = [
      {
        id: 'iss',
        name: 'ISS (International Space Station)',
        orbitId: 'low',
        speed: 0.0055,
        angle: 0,
        metadata: {
          noradId: '25544',
          altitude: '418 km',
          orbitType: 'Low Earth Orbit (LEO)',
          inclination: '51.64°',
          velocity: '27,560 km/h',
          mission: 'International scientific research laboratory and orbital space station.'
        }
      },
      {
        id: 'hubble',
        name: 'Hubble Space Telescope',
        orbitId: 'mid',
        speed: 0.004,
        angle: Math.PI / 2,
        metadata: {
          noradId: '20580',
          altitude: '535 km',
          orbitType: 'Low Earth Orbit (LEO)',
          inclination: '28.47°',
          velocity: '27,300 km/h',
          mission: 'Deep space astronomical observation and multi-wavelength imaging.'
        }
      },
      {
        id: 'gps',
        name: 'GPS Block III (USA-289)',
        orbitId: 'mid',
        speed: 0.0035,
        angle: Math.PI * 1.5, // Placed on the same orbit but offset by 180 degrees so they never collide!
        metadata: {
          noradId: '43873',
          altitude: '20,180 km',
          orbitType: 'Medium Earth Orbit (MEO)',
          inclination: '55.00°',
          velocity: '14,000 km/h',
          mission: 'High-precision global positioning, military & civil timing synchronization.'
        }
      },
      {
        id: 'sentinel',
        name: 'Sentinel-1B (Radar)',
        orbitId: 'polar',
        speed: 0.0028,
        angle: Math.PI * 1.3,
        metadata: {
          noradId: '41456',
          altitude: '693 km',
          orbitType: 'Sun-Synchronous Polar LEO',
          inclination: '98.18°',
          velocity: '26,500 km/h',
          mission: 'All-weather, day-and-night C-band synthetic aperture radar earth imaging.'
        }
      }
    ];

    const satelliteMeshes: {
      mesh: THREE.Group;
      config: typeof satellites[0];
      pathConfig: typeof orbitPaths[0];
      orbitMaterial: THREE.ShaderMaterial;
    }[] = [];

    // Create 4 Custom High-Fidelity 3D Model Groups and unique orbital paths
    satellites.forEach(sat => {
      const satGroup = new THREE.Group();
      const pathConfig = orbitPaths.find(p => p.id === sat.orbitId)!;

      // Create Custom Orbit Path Ring (Line) with a custom ShaderMaterial for radial gradient fade
      const orbitGeometry = new THREE.BufferGeometry();
      const points = [];
      const angles = [];
      const segments = 120;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const x = Math.cos(theta) * pathConfig.radius;
        const z = Math.sin(theta) * pathConfig.radius;
        const y = 0;
        
        // Tilt the orbit around X-axis by inclination angle
        const inclinedY = y * Math.cos(pathConfig.inclination) - z * Math.sin(pathConfig.inclination);
        const inclinedZ = y * Math.sin(pathConfig.inclination) + z * Math.cos(pathConfig.inclination);
        
        points.push(new THREE.Vector3(x, inclinedY, inclinedZ));
        angles.push(theta); // pass the original un-inclined angle for fragment shader distance calculation
      }
      orbitGeometry.setFromPoints(points);
      orbitGeometry.setAttribute('aAngle', new THREE.BufferAttribute(new Float32Array(angles), 1));

      // Custom ShaderMaterial to calculate radial distance from current satellite position and fade it out
      const orbitMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(pathConfig.color) },
          uSatAngle: { value: sat.angle }
        },
        vertexShader: `
          attribute float aAngle;
          varying float vAngle;
          void main() {
            vAngle = aAngle;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uSatAngle;
          varying float vAngle;
          void main() {
            // Normalize angles between [0, 2*PI]
            float sat = mod(uSatAngle, 6.2831853);
            
            // Calculate distance along the circle
            float diff = abs(vAngle - sat);
            if (diff > 3.1415926) {
              diff = 6.2831853 - diff;
            }
            
            // Ethereal gradient fade trailing behind the satellite
            float fade = 1.0 - (diff / 3.1415926);
            fade = pow(fade, 3.0); // exponential falloff for comet tail look
            
            gl_FragColor = vec4(uColor, 0.45 * fade);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
      scene.add(orbitLine);

      if (sat.id === 'iss') {
        // === ISS MODEL ===
        // 1. Central Truss Structure
        const trussGeo = new THREE.BoxGeometry(0.8, 0.04, 0.04);
        const silverMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.2, metalness: 0.8 });
        const truss = new THREE.Mesh(trussGeo, silverMat);
        satGroup.add(truss);

        // 2. pressurized modules cylinder stack
        const moduleGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 12);
        moduleGeo.rotateZ(Math.PI / 2);
        const moduleMesh = new THREE.Mesh(moduleGeo, silverMat);
        satGroup.add(moduleMesh);

        const crossGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.2, 12);
        const crossMesh = new THREE.Mesh(crossGeo, silverMat);
        satGroup.add(crossMesh);

        // 3. Four Massive Double-sided Solar Array Panels
        const copperMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.3, metalness: 0.75 });
        const panelGeo = new THREE.BoxGeometry(0.12, 0.01, 0.45);
        
        const panel1 = new THREE.Mesh(panelGeo, copperMat);
        panel1.position.set(0.35, 0.08, 0);
        satGroup.add(panel1);

        const panel2 = new THREE.Mesh(panelGeo, copperMat);
        panel2.position.set(-0.35, 0.08, 0);
        satGroup.add(panel2);

        const panel3 = new THREE.Mesh(panelGeo, copperMat);
        panel3.position.set(0.35, -0.08, 0);
        satGroup.add(panel3);

        const panel4 = new THREE.Mesh(panelGeo, copperMat);
        panel4.position.set(-0.35, -0.08, 0);
        satGroup.add(panel4);

      } else if (sat.id === 'hubble') {
        // === HUBBLE SPACE TELESCOPE ===
        const bodyGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.38, 16);
        const silverMat = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.1, metalness: 0.95 });
        const telescopeBody = new THREE.Mesh(bodyGeo, silverMat);
        telescopeBody.rotation.x = Math.PI / 2;
        satGroup.add(telescopeBody);

        const lidGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.01, 16);
        const lid = new THREE.Mesh(lidGeo, silverMat);
        lid.position.set(0, 0, 0.2);
        lid.rotation.x = -Math.PI / 4;
        satGroup.add(lid);

        const panelGeo = new THREE.BoxGeometry(0.48, 0.02, 0.08);
        const panelMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.15, metalness: 0.85 });
        const panel1 = new THREE.Mesh(panelGeo, panelMat);
        panel1.position.set(0.24, 0, 0);
        satGroup.add(panel1);

        const panel2 = new THREE.Mesh(panelGeo, panelMat);
        panel2.position.set(-0.24, 0, 0);
        satGroup.add(panel2);

        const antennaGeo = new THREE.ConeGeometry(0.04, 0.06, 12);
        const antenna = new THREE.Mesh(antennaGeo, silverMat);
        antenna.position.set(0, -0.12, 0);
        antenna.rotation.x = Math.PI;
        satGroup.add(antenna);

      } else if (sat.id === 'gps') {
        // === GPS BLOCK III NAVIGATION SATELLITE ===
        // 1. Core Gold Foil Payload Body
        const busGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
        const foilMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.15, metalness: 0.85 });
        const bus = new THREE.Mesh(busGeo, foilMat);
        satGroup.add(bus);

        // 2. High-gain helical navigation antenna array facing the Earth
        const antennaCluster = new THREE.Group();
        const elementGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.08, 8);
        const silverMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.2, metalness: 0.8 });
        for (let i = 0; i < 4; i++) {
          const ant = new THREE.Mesh(elementGeo, silverMat);
          const angle = (i / 4) * Math.PI * 2;
          ant.position.set(Math.cos(angle) * 0.04, -0.1, Math.sin(angle) * 0.04);
          antennaCluster.add(ant);
        }
        satGroup.add(antennaCluster);

        // 3. Symmetrical extremely wide solar array wings
        const panelGeo = new THREE.BoxGeometry(0.56, 0.015, 0.07);
        const panelMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.15, metalness: 0.85 });
        const panelLeft = new THREE.Mesh(panelGeo, panelMat);
        panelLeft.position.set(0.35, 0, 0);
        satGroup.add(panelLeft);

        const panelRight = new THREE.Mesh(panelGeo, panelMat);
        panelRight.position.set(-0.35, 0, 0);
        satGroup.add(panelRight);

      } else {
        // === SENTINEL-1B RADAR SATELLITE ===
        const busGeo = new THREE.BoxGeometry(0.15, 0.15, 0.22);
        const foilMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.15, metalness: 0.85 });
        const bus = new THREE.Mesh(busGeo, foilMat);
        satGroup.add(bus);

        const sarGeo = new THREE.BoxGeometry(0.04, 0.06, 0.68);
        const greyMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.3, metalness: 0.6 });
        const sarAntenna = new THREE.Mesh(sarGeo, greyMat);
        sarAntenna.position.set(0, -0.11, 0);
        satGroup.add(sarAntenna);

        const panelGeo = new THREE.BoxGeometry(0.45, 0.015, 0.09);
        const panelMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.2, metalness: 0.8 });
        const panelLeft = new THREE.Mesh(panelGeo, panelMat);
        panelLeft.position.set(0.3, 0, 0.05);
        satGroup.add(panelLeft);

        const panelRight = new THREE.Mesh(panelGeo, panelMat);
        panelRight.position.set(-0.3, 0, 0.05);
        satGroup.add(panelRight);
      }

      scene.add(satGroup);
      satelliteMeshes.push({ mesh: satGroup, config: sat, pathConfig, orbitMaterial });
    });

    // 7. Interactive Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 6;
    controls.maxDistance = 25;
    controls.enablePan = false;

    // 8. Raycaster for click & hover handling
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(hotspots);
      if (intersects.length > 0) {
        setActiveStation(intersects[0].object.userData);
      } else {
        setActiveStation(null);
      }
    };
    window.addEventListener('click', onClick);

    const onMouseMove = (e: MouseEvent) => {
      if (!renderer.domElement) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Update screen space coordinate for rendering tooltip overlay
      setMousePos({ x: e.clientX, y: e.clientY });

      raycaster.setFromCamera(mouse, camera);

      // Raycast against all satellites recursively (deep search inside the Group)
      const targets = satelliteMeshes.map(s => s.mesh);
      const intersects = raycaster.intersectObjects(targets, true);

      if (intersects.length > 0) {
        // Trace back the scene tree from intersected child to locate the root Group object
        let obj: THREE.Object3D | null = intersects[0].object;
        let matchedSat = null;
        while (obj && obj !== scene) {
          matchedSat = satelliteMeshes.find(s => s.mesh === obj);
          if (matchedSat) break;
          obj = obj.parent;
        }

        if (matchedSat) {
          document.body.style.cursor = 'pointer';
          const newSatConfig = matchedSat.config;
          setHoveredSatellite((prev: any) => (prev?.id === newSatConfig.id ? prev : newSatConfig));
          return;
        }
      }

      // Check if hovering over ground station hotspots to set pointer cursor
      const hotspotIntersects = raycaster.intersectObjects(hotspots);
      if (hotspotIntersects.length > 0) {
        document.body.style.cursor = 'pointer';
      } else {
        document.body.style.cursor = 'default';
      }
      setHoveredSatellite((prev: any) => (prev === null ? null : null));
    };
    window.addEventListener('mousemove', onMouseMove);

    // 9. Animation & Rotation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      // Smooth continuous self-rotation on the Earth
      globeGroup.rotation.y += 0.0012;

      // Update Satellites along their orbits
      satelliteMeshes.forEach(sat => {
        sat.config.angle += sat.config.speed;
        
        // Update the shader uniform for dynamic trail fading
        sat.orbitMaterial.uniforms.uSatAngle.value = sat.config.angle;
        
        // Calculate position on the circle using pathConfig radius
        const x = Math.cos(sat.config.angle) * sat.pathConfig.radius;
        const z = Math.sin(sat.config.angle) * sat.pathConfig.radius;
        const y = 0;

        // Apply inclination rotation (around X-axis) using pathConfig inclination
        const inclinedY = y * Math.cos(sat.pathConfig.inclination) - z * Math.sin(sat.pathConfig.inclination);
        const inclinedZ = y * Math.sin(sat.pathConfig.inclination) + z * Math.cos(sat.pathConfig.inclination);
        
        sat.mesh.position.set(x, inclinedY, inclinedZ);
        
        // Orient satellite to always look towards the Earth (0,0,0)
        sat.mesh.lookAt(new THREE.Vector3(0, 0, 0));
        // Rotate so solar panels align parallel to the orbit
        sat.mesh.rotateX(Math.PI / 2);
      });

      // Pulse ground stations
      hotspots.forEach((h, index) => {
        const pulse = 1 + Math.sin(Date.now() * 0.004 + index) * 0.15;
        h.scale.set(pulse, pulse, pulse);
      });

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 10. Robust, Dynamic ResizeObserver to guarantee 100% accurate layout bounds
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    // 11. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('click', onClick);
      window.removeEventListener('mousemove', onMouseMove);
      document.body.style.cursor = 'default';
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      renderer.dispose();
      scene.clear();
    };
  }, []);

  // Prevent tooltip from overflowing the right/bottom viewport edge
  let tooltipLeft = mousePos.x + 15;
  let tooltipTop = mousePos.y + 15;
  if (tooltipLeft + 288 > window.innerWidth) {
    tooltipLeft = mousePos.x - 303; // shift to the left of the cursor
  }
  if (tooltipTop + 185 > window.innerHeight) {
    tooltipTop = mousePos.y - 195; // shift above the cursor
  }

  return (
    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-transparent">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing relative" />
      
      {/* 1. Ground Station Active Information Modal */}
      {activeStation && (
        <div className="absolute bottom-6 right-6 sm:bottom-12 sm:right-12 bg-slate-950/95 p-5 sm:p-6 rounded-2xl border border-cyan-500/40 text-white z-20 w-[290px] sm:w-[320px] shadow-2xl shadow-cyan-500/10 backdrop-blur-xl pointer-events-auto">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400">Ground Station Connected</span>
            </div>
            <h3 className="text-base font-bold text-white mb-2">{activeStation.name}</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{activeStation.desc}</p>
            <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3">
              <span className="text-[9px] font-mono text-slate-500 uppercase">LAT: {activeStation.lat} &middot; LON: {activeStation.lon}</span>
              <button 
                onClick={() => setActiveStation(null)} 
                className="text-[10px] text-cyan-400 hover:text-cyan-300 uppercase tracking-wider font-mono font-bold cursor-pointer hover:underline"
              >
                Disconnect
              </button>
            </div>
        </div>
      )}

      {/* 2. Floating Satellite Metadata Tooltip */}
      {hoveredSatellite && (
        <div 
          className="fixed pointer-events-none bg-slate-950/90 border border-cyan-500/40 text-white rounded-xl p-4 shadow-2xl backdrop-blur-md z-50 w-72 flex flex-col gap-2.5 animate-modal-intro"
          style={{
            left: `${tooltipLeft}px`,
            top: `${tooltipTop}px`
          }}
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="font-bold text-xs text-cyan-400">{hoveredSatellite.name}</span>
            <span className="text-[8px] font-mono bg-cyan-950/80 border border-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded shrink-0">
              ID: {hoveredSatellite.metadata.noradId}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-[10px] font-sans">
            <div>
              <span className="text-slate-500 text-[8px] uppercase block tracking-wider font-semibold">Altitude</span>
              <span className="text-white font-mono text-[9px]">{hoveredSatellite.metadata.altitude}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[8px] uppercase block tracking-wider font-semibold">Inclination</span>
              <span className="text-white font-mono text-[9px]">{hoveredSatellite.metadata.inclination}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[8px] uppercase block tracking-wider font-semibold">Velocity</span>
              <span className="text-white font-mono text-[9px]">{hoveredSatellite.metadata.velocity}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[8px] uppercase block tracking-wider font-semibold">Orbit Type</span>
              <span className="text-white text-[9px] truncate" title={hoveredSatellite.metadata.orbitType}>
                {hoveredSatellite.metadata.orbitType}
              </span>
            </div>
          </div>
          
          <div className="border-t border-slate-800/80 pt-2">
            <p className="text-[9px] text-slate-300 leading-relaxed">
              {hoveredSatellite.metadata.mission}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export const ThreeEarthHero: React.FC = () => (
  <GlobeErrorBoundary>
    <ThreeEarthHeroContent />
  </GlobeErrorBoundary>
);
