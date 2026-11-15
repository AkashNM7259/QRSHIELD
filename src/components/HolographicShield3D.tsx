import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface HolographicShield3DProps {
  riskLevel?: 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK' | 'UNKNOWN';
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const HolographicShield3D: React.FC<HolographicShield3DProps> = ({
  riskLevel = 'SAFE',
  interactive = true,
  size = 'lg'
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webGlSupported, setWebGlSupported] = useState<boolean>(true);

  // Dynamic laser crimson accent intensity based on risk level
  const getAccents = () => {
    switch (riskLevel) {
      case 'HIGH_RISK':
        return {
          chrome: 0xA0A0A0,
          laser: 0xFF0033,
          glowIntensity: 4.5,
          wireOpacity: 0.9,
          qrColor: '#FF0033'
        };
      case 'SUSPICIOUS':
        return {
          chrome: 0xB8B8B8,
          laser: 0xFF0033,
          glowIntensity: 2.8,
          wireOpacity: 0.75,
          qrColor: '#FF3355'
        };
      case 'SAFE':
      default:
        return {
          chrome: 0xE0E0E0,
          laser: 0xFF0033,
          glowIntensity: 2.0,
          wireOpacity: 0.6,
          qrColor: '#FF0033'
        };
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGlSupported(false);
        return;
      }
    } catch {
      setWebGlSupported(false);
      return;
    }

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const accents = getAccents();

    // 2. Realistic 3D Chrome Shield Geometry
    const shieldShape = new THREE.Shape();
    shieldShape.moveTo(0, 1.85);
    shieldShape.lineTo(1.35, 1.45);
    shieldShape.lineTo(1.42, 0.25);
    shieldShape.lineTo(0.92, -0.95);
    shieldShape.lineTo(0, -2.0);
    shieldShape.lineTo(-0.92, -0.95);
    shieldShape.lineTo(-1.42, 0.25);
    shieldShape.lineTo(-1.35, 1.45);
    shieldShape.closePath();

    const extrudeSettings = {
      depth: 0.28,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.12,
      bevelThickness: 0.12,
    };

    const shieldGeo = new THREE.ExtrudeGeometry(shieldShape, extrudeSettings);
    shieldGeo.center();

    // Highly Reflective Metallic Chrome Material
    const chromeMaterial = new THREE.MeshPhysicalMaterial({
      color: accents.chrome,
      metalness: 0.95,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 0.9,
      transparent: true,
      opacity: 0.88,
    });

    const shieldMesh = new THREE.Mesh(shieldGeo, chromeMaterial);

    // Chrome Silver Precision Wireframe Edge
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xC0C0C0,
      wireframe: true,
      transparent: true,
      opacity: accents.wireOpacity
    });
    const wireMesh = new THREE.Mesh(shieldGeo, wireMat);
    shieldMesh.add(wireMesh);
    scene.add(shieldMesh);

    // 3. Central Floating Laser Crimson QR Code
    const qrPlaneGeo = new THREE.PlaneGeometry(1.25, 1.25, 4, 4);
    const qrCanvas = document.createElement('canvas');
    qrCanvas.width = 128;
    qrCanvas.height = 128;
    const ctx = qrCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = accents.qrColor;

      // Draw stylized high-contrast QR matrix pattern with finder patterns
      // Finder 1 (Top Left)
      ctx.fillRect(16, 16, 36, 36);
      ctx.fillStyle = '#050505';
      ctx.fillRect(24, 24, 20, 20);
      ctx.fillStyle = accents.qrColor;
      ctx.fillRect(28, 28, 12, 12);

      // Finder 2 (Top Right)
      ctx.fillRect(76, 16, 36, 36);
      ctx.fillStyle = '#050505';
      ctx.fillRect(84, 24, 20, 20);
      ctx.fillStyle = accents.qrColor;
      ctx.fillRect(88, 28, 12, 12);

      // Finder 3 (Bottom Left)
      ctx.fillRect(16, 76, 36, 36);
      ctx.fillStyle = '#050505';
      ctx.fillRect(24, 84, 20, 20);
      ctx.fillStyle = accents.qrColor;
      ctx.fillRect(28, 88, 12, 12);

      // Scattered digital bits
      for (let x = 3; x < 6; x++) {
        for (let y = 1; y < 7; y++) {
          if ((x * 3 + y * 5) % 2 === 0) {
            ctx.fillRect(x * 16 + 2, y * 16 + 2, 12, 12);
          }
        }
      }
    }
    const qrTexture = new THREE.CanvasTexture(qrCanvas);
    const qrMat = new THREE.MeshBasicMaterial({
      map: qrTexture,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide
    });
    const qrMesh = new THREE.Mesh(qrPlaneGeo, qrMat);
    scene.add(qrMesh);

    // 4. Rotating 3D Security Rings
    // Ring 1: Chrome Silver
    const ringGeo1 = new THREE.TorusGeometry(2.35, 0.02, 16, 100);
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0xC0C0C0,
      metalness: 0.9,
      roughness: 0.2
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3.2;
    scene.add(ring1);

    // Ring 2: Laser Crimson Red
    const ringGeo2 = new THREE.TorusGeometry(2.55, 0.018, 16, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xFF0033,
      transparent: true,
      opacity: 0.8
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    scene.add(ring2);

    // 5. Subtle Crimson & Silver Security Particles
    const particleCount = 85;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 8.5;
      particlePositions[i + 1] = (Math.random() - 0.5) * 8.5;
      particlePositions[i + 2] = (Math.random() - 0.5) * 6;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xFF0033,
      size: 0.05,
      transparent: true,
      opacity: 0.75,
    });
    const particlePoints = new THREE.Points(particleGeo, particleMat);
    scene.add(particlePoints);

    // 6. Cyber Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.8);
    scene.add(ambientLight);

    // Chrome reflection key light
    const chromeKeyLight = new THREE.DirectionalLight(0xE5E5E5, 2.5);
    chromeKeyLight.position.set(4, 5, 5);
    scene.add(chromeKeyLight);

    // Chrome rim light
    const chromeRimLight = new THREE.DirectionalLight(0xC0C0C0, 1.8);
    chromeRimLight.position.set(-4, -3, 3);
    scene.add(chromeRimLight);

    // Laser Crimson point light (radiating from center of shield)
    const laserPointLight = new THREE.PointLight(0xFF0033, accents.glowIntensity, 15);
    laserPointLight.position.set(0, 0, 1.5);
    scene.add(laserPointLight);

    // 7. Interactive Mouse Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      targetX = x * 0.75;
      targetY = -y * 0.75;
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // 8. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth parallax interpolation
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      // Chrome Shield floating and subtle responsive tilting
      shieldMesh.rotation.y = Math.sin(elapsedTime * 0.45) * 0.18 + mouseX * 0.45;
      shieldMesh.rotation.x = Math.cos(elapsedTime * 0.35) * 0.08 + mouseY * 0.45;
      shieldMesh.position.y = Math.sin(elapsedTime * 1.4) * 0.07;

      // Floating laser QR
      qrMesh.rotation.y = Math.sin(elapsedTime * 0.7) * 0.15 + mouseX * 0.25;
      qrMesh.position.y = Math.sin(elapsedTime * 1.4) * 0.07;

      // Security rings counter-rotation
      ring1.rotation.z += 0.007;
      ring2.rotation.z -= 0.005;
      ring1.position.y = Math.sin(elapsedTime * 1.1) * 0.04;
      ring2.position.y = -Math.sin(elapsedTime * 1.1) * 0.04;

      // Subtle particle float
      particlePoints.rotation.y = elapsedTime * 0.03;
      particlePoints.rotation.x = elapsedTime * 0.015;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (interactive) window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      shieldGeo.dispose();
      chromeMaterial.dispose();
      wireMat.dispose();
      qrPlaneGeo.dispose();
      qrTexture.dispose();
      qrMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [riskLevel, interactive]);

  const sizeClasses = {
    sm: 'w-48 h-48 sm:w-60 sm:h-60',
    md: 'w-72 h-72 sm:w-80 sm:h-80',
    lg: 'w-80 h-80 sm:w-[440px] sm:h-[440px] lg:w-[490px] lg:h-[490px]'
  }[size];

  // Graceful CSS Fallback
  if (!webGlSupported) {
    return (
      <div className={`relative flex items-center justify-center ${sizeClasses}`}>
        <div className="absolute inset-0 rounded-full border border-chrome-400/25 animate-spin-slow" />
        <div className="absolute inset-4 rounded-full border border-laser-500/40 animate-radar" />
        <div className="relative z-10 w-36 h-44 bg-obsidian-800/90 border-2 border-chrome-400 rounded-2xl flex flex-col items-center justify-center shadow-laser-red backdrop-blur-md">
          <div className="w-16 h-16 border-2 border-dashed border-laser-500 rounded-lg flex items-center justify-center animate-pulse">
            <div className="w-8 h-8 bg-laser-500/40 rounded" />
          </div>
          <span className="mt-3 text-[10px] font-mono text-chrome-300 font-bold uppercase tracking-wider">
            CHROME SHIELD
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses}`}>
      {/* Background Subtle Laser Crimson Ambient Glow */}
      <div
        className={`absolute -inset-6 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 ${
          riskLevel === 'HIGH_RISK'
            ? 'bg-laser-500/35 opacity-90'
            : riskLevel === 'SUSPICIOUS'
            ? 'bg-laser-500/25 opacity-70'
            : 'bg-laser-500/18 opacity-50'
        }`}
      />
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};
