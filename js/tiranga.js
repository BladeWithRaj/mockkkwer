(function() {
  // Prevent duplicate rendering
  if (document.getElementById('tiranga-bg-canvas')) return;

  // Insert background canvas styling
  const style = document.createElement('style');
  style.textContent = `
    #tiranga-bg-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: -10;
      pointer-events: none;
      opacity: 0.15;
      transition: opacity 0.5s ease;
    }
    /* Ensure the main page structure is transparent enough to let the background shine */
    body {
      position: relative;
      background-color: var(--lp-bg, var(--bg-primary, #000000)) !important;
    }
  `;
  document.head.appendChild(style);

  // Load Three.js dynamically if not already available
  if (typeof THREE === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.onload = initTiranga;
    script.onerror = () => {
      console.warn('Failed to load Three.js CDN for the 3D flag background.');
    };
    document.head.appendChild(script);
  } else {
    initTiranga();
  }

  function initTiranga() {
    // Create the canvas element
    const canvas = document.createElement('canvas');
    canvas.id = 'tiranga-bg-canvas';
    document.body.appendChild(canvas);

    // Three.js Scene setup
    const scene = new THREE.Scene();
    
    // Perspective Camera
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 10);

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Create flag texture dynamically on a 2D canvas
    function createFlagCanvas() {
      const fCanvas = document.createElement('canvas');
      fCanvas.width = 512;
      fCanvas.height = 341; // 3:2 standard flag ratio
      const ctx = fCanvas.getContext('2d');

      // 1. Saffron band
      ctx.fillStyle = '#FF9933';
      ctx.fillRect(0, 0, 512, 113.6);

      // 2. White band
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 113.6, 512, 113.6);

      // 3. Green band
      ctx.fillStyle = '#138808';
      ctx.fillRect(0, 227.2, 512, 113.8);

      // 4. Ashoka Chakra (Navy Blue)
      const cx = 256;
      const cy = 170.5;
      const r = 40;

      ctx.strokeStyle = '#000080';
      ctx.lineWidth = 3.5;

      // Outer Ring
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Hub Circle
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#000080';
      ctx.fill();

      // 24 Spokes
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 24; i++) {
        const angle = (i * Math.PI * 2) / 24;
        const x1 = cx + Math.cos(angle) * 6;
        const y1 = cy + Math.sin(angle) * 6;
        const x2 = cx + Math.cos(angle) * r;
        const y2 = cy + Math.sin(angle) * r;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Tip circle
        ctx.beginPath();
        ctx.arc(x2, y2, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#000080';
        ctx.fill();
      }

      return fCanvas;
    }

    const flagTexture = new THREE.CanvasTexture(createFlagCanvas());
    flagTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // Create flag assembly group
    const flagGroup = new THREE.Group();

    // 1. Flagpole (Cylinder)
    const poleGeom = new THREE.CylinderGeometry(0.08, 0.08, 10, 16);
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.9,
      roughness: 0.1
    });
    const pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.set(-2.5, 0, 0);
    flagGroup.add(pole);

    // 2. Pole Cap Sphere (Gold)
    const capGeom = new THREE.SphereGeometry(0.18, 16, 16);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.1
    });
    const cap = new THREE.Mesh(capGeom, capMat);
    cap.position.set(-2.5, 5, 0);
    flagGroup.add(cap);

    // 3. Waving Flag Plane
    const flagWidth = 5.0;
    const flagHeight = 3.33;
    // High-density segments for smooth waves
    const flagGeom = new THREE.PlaneGeometry(flagWidth, flagHeight, 40, 30);
    const flagMat = new THREE.MeshStandardMaterial({
      map: flagTexture,
      side: THREE.DoubleSide,
      roughness: 0.3,
      metalness: 0.1
    });
    const flag = new THREE.Mesh(flagGeom, flagMat);
    // Align left edge of flag to the pole at x = -2.5
    flag.position.set(0, 3.33, 0);
    flagGroup.add(flag);

    scene.add(flagGroup);

    // Set initial tilt for beautiful 3D presentation
    flagGroup.rotation.x = 0.15;
    flagGroup.rotation.z = -0.12;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.2);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // Layout resizing and responsiveness helper
    function resize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      if (width < 768) {
        // Center flag on mobile screens, scale it down slightly
        flagGroup.position.set(0, -0.2, -8);
        flagGroup.scale.set(0.7, 0.7, 0.7);
      } else {
        // Align slightly to the right on desktop to prevent obscuring left-heavy content layouts
        flagGroup.position.set(2.2, -0.4, -8);
        flagGroup.scale.set(1.0, 1.0, 1.0);
      }
    }

    window.addEventListener('resize', resize);
    resize(); // initial layout setup

    // Animation Loop
    const clock = new THREE.Clock();
    
    function animate() {
      requestAnimationFrame(animate);

      const time = clock.getElapsedTime();

      // Slow 360-degree rotation of the entire flag group
      flagGroup.rotation.y = time * 0.12;

      // Realistic wave animation using math displacement on PlaneGeometry
      const position = flagGeom.attributes.position;
      
      for (let i = 0; i < position.count; i++) {
        const x = position.getX(i);
        const y = position.getY(i);

        // Distance from the pole (flag is attached on left edge x = -2.5)
        // Amplitudes are zero at the pole attachment and grow towards the fly edge
        const factor = (x + 2.5) / flagWidth; 

        // S-curve waving equations
        const waveX = Math.sin(x * 1.5 - time * 3.5) * 0.28 * factor;
        const waveY = Math.cos(y * 1.0 - time * 2.0) * 0.08 * factor;

        position.setZ(i, waveX + waveY);
      }

      position.needsUpdate = true;
      flagGeom.computeVertexNormals();

      renderer.render(scene, camera);
    }

    animate();
  }
})();
