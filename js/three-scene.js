(function () {
  const container = document.getElementById('canvas-3d-container');
  if (!container) return;

  // Scene setup
  const scene = new THREE.Scene();

  // Camera
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.z = 12;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Group to hold all 3D objects (for easy mouse tilting)
  const mainGroup = new THREE.Group();
  scene.add(mainGroup);

  // 3D Torus Knot - Solid core for volume
  const torusKnotGeo = new THREE.TorusKnotGeometry(2.2, 0.6, 120, 16, 3, 4);
  
  // Custom materials for a futuristic cyber look
  const solidMat = new THREE.MeshStandardMaterial({
    color: 0x180f33,
    roughness: 0.15,
    metalness: 0.9,
    flatShading: true,
    transparent: true,
    opacity: 0.85
  });
  
  const solidMesh = new THREE.Mesh(torusKnotGeo, solidMat);
  mainGroup.add(solidMesh);

  // Wireframe overlay for glowing cybergrid effect
  const wireframeMat = new THREE.MeshBasicMaterial({
    color: 0x7c5cff,
    wireframe: true,
    transparent: true,
    opacity: 0.45
  });
  const wireframeMesh = new THREE.Mesh(torusKnotGeo, wireframeMat);
  wireframeMesh.scale.setScalar(1.002); // Slightly larger to prevent z-fighting
  mainGroup.add(wireframeMesh);

  // Second wireframe overlay in cyan for chromatic aberration effect
  const wireframeMat2 = new THREE.MeshBasicMaterial({
    color: 0x35d6ff,
    wireframe: true,
    transparent: true,
    opacity: 0.3
  });
  const wireframeMesh2 = new THREE.Mesh(torusKnotGeo, wireframeMat2);
  wireframeMesh2.scale.setScalar(1.008);
  wireframeMesh2.rotation.y = 0.02;
  mainGroup.add(wireframeMesh2);

  // Ambient Starfield / Particle Cloud
  const particleCount = 140;
  const particlesGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const colorAccent1 = new THREE.Color(0x7c5cff);
  const colorAccent2 = new THREE.Color(0x35d6ff);

  for (let i = 0; i < particleCount; i++) {
    // Distribute in a spherical region
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 4.5 + Math.random() * 3.5; // Radius between 4.5 and 8

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Mixed colors
    const mixedColor = Math.random() > 0.5 ? colorAccent1 : colorAccent2;
    colors[i * 3] = mixedColor.r;
    colors[i * 3 + 1] = mixedColor.g;
    colors[i * 3 + 2] = mixedColor.b;
  }

  particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particlesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Small square particles
  const particleMat = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  });

  const particleSystem = new THREE.Points(particlesGeo, particleMat);
  mainGroup.add(particleSystem);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const cyanLight = new THREE.PointLight(0x35d6ff, 3, 30);
  cyanLight.position.set(5, 5, 5);
  scene.add(cyanLight);

  const purpleLight = new THREE.PointLight(0x7c5cff, 4, 30);
  purpleLight.position.set(-5, -5, 5);
  scene.add(purpleLight);

  // Mouse Interaction variables
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;

  const windowHalfX = window.innerWidth / 2;
  const windowHalfY = window.innerHeight / 2;

  // Track mouse coordinates
  window.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX) / 100;
    mouseY = (event.clientY - windowHalfY) / 100;
  });

  // Track touch coordinates for mobile devices
  window.addEventListener('touchmove', (event) => {
    if (event.touches.length > 0) {
      mouseX = (event.touches[0].clientX - windowHalfX) / 100;
      mouseY = (event.touches[0].clientY - windowHalfY) / 100;
    }
  });

  // Track click for 3D scale burst effect
  let burstEnergy = 0;
  container.addEventListener('click', () => {
    burstEnergy = 1.0;
  });

  // Animation loop
  let time = 0;
  function animate() {
    requestAnimationFrame(animate);

    time += 0.005;

    // Decaying burst energy on click
    if (burstEnergy > 0) {
      burstEnergy *= 0.92;
      if (burstEnergy < 0.001) burstEnergy = 0;
    }

    // Smoothly interpolate towards mouse position (easing)
    targetX += (mouseX - targetX) * 0.05;
    targetY += (mouseY - targetY) * 0.05;

    // Apply rotation based on time, mouse, and click burst energy
    const rotSpeedMultiplier = 1.0 + burstEnergy * 3.0;
    mainGroup.rotation.y += 0.005 * rotSpeedMultiplier + (targetX * 0.01);
    mainGroup.rotation.x = (time * 0.2) + (targetY * 0.3);

    // Rotate particles slightly independently
    particleSystem.rotation.y = -time * 0.15;
    particleSystem.rotation.z = time * 0.05;

    // Pulsate Torus Knot sizes slightly + click burst scale surge
    const pulse = 1.0 + Math.sin(time * 2) * 0.04 + (burstEnergy * 0.25);
    solidMesh.scale.set(pulse, pulse, pulse);
    wireframeMesh.scale.set(pulse * 1.002, pulse * 1.002, pulse * 1.002);
    wireframeMesh2.scale.set(pulse * 1.008, pulse * 1.008, pulse * 1.008);

    // Floating drift
    mainGroup.position.y = Math.sin(time * 1.5) * 0.15;

    renderer.render(scene, camera);
  }

  animate();

  // Resize listener
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
})();

