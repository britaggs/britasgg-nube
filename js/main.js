// ===============================
// BRITASGG - AVATAR 3D ENGINE
// VERSION ES6 MODULE
// ===============================

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

window.addEventListener("DOMContentLoaded", () => {
  console.log('🚀 Iniciando Avatar 3D Engine...');
  console.log('✅ Three.js version:', THREE.REVISION);
  initAvatar3D();
});

function initAvatar3D() {
  const container = document.getElementById("avatar-wrapper");
  if (!container) {
    console.error("❌ No se encontró #avatar-wrapper");
    return;
  }

  console.log('✅ Contenedor encontrado');

  // ESCENA
  const scene = new THREE.Scene();
  scene.background = null;

  // CÁMARA
  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );
  camera.position.set(0, 0.9, 2.5);
  camera.lookAt(0, 0.9, 0);

  // RENDER
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Insertar canvas ANTES de las guías
  container.insertBefore(renderer.domElement, container.firstChild);

  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.top = '0';
  renderer.domElement.style.left = '0';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';

  console.log('✅ Renderer creado');

  // LUCES
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(2, 3, 4);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
  fillLight.position.set(-2, 2, 2);
  scene.add(fillLight);

  const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
  backLight.position.set(0, 2, -3);
  scene.add(backLight);

  console.log('✅ Luces configuradas');

  // ===============================
  // ESTADO DE MEDIDAS (declarar primero)
  // ===============================
  const state = {
    hombros: 40,
    pecho: 92,
    espalda: 38,
    cintura: 70,
    cadera: 98,
    rotationY: 0,
    // Sistema de prendas
    prendas: {
      camiseta: null,
      pantalon: null,
      vestido: null,
      chaqueta: null,
      catalogo: null
    },
    cabello: null   // ← agrega esta línea
  };
  window.state = state;
  // ===============================
  // AVATAR
  // ===============================
  let avatar;

  console.log('🎨 Creando modelo de prueba...');
  createTestAvatar();

  // Intentar cargar modelo GLTF
  const loader = new GLTFLoader();
  console.log('🔄 Intentando cargar models/scene.gltf...');

  loader.load(
    "models/scene.gltf",
    (gltf) => {
      console.log("✅ Avatar GLTF cargado correctamente!");

      if (avatar) {
        scene.remove(avatar);
        console.log('🔄 Modelo de prueba removido');
      }

      avatar = gltf.scene;

      avatar.scale.set(0.9, 0.9, 0.9);
      avatar.position.set(0, 0, 0);
      avatar.rotation.x = 0;

      scene.add(avatar);

      const box = new THREE.Box3().setFromObject(avatar);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      console.log("📏 Tamaño del modelo:", size);
      console.log("📍 Centro del modelo:", center);

      avatar.position.y = -box.min.y;

      // DIAGNÓSTICO: Analizar estructura del modelo
      console.log("🔍 Analizando estructura del modelo GLTF:");
      avatar.traverse((child) => {
        if (child.isMesh) {
          console.log("  ✓ Mesh encontrado:", child.name);
          console.log("    - Vértices:", child.geometry.attributes.position.count);
          console.log("    - Posición:", child.position);

          // Analizar rango de todos los ejes
          const positions = child.geometry.attributes.position.array;
          let minX = Infinity, maxX = -Infinity;
          let minY = Infinity, maxY = -Infinity;
          let minZ = Infinity, maxZ = -Infinity;

          for (let i = 0; i < positions.length; i += 3) {
            minX = Math.min(minX, positions[i]);
            maxX = Math.max(maxX, positions[i]);
            minY = Math.min(minY, positions[i + 1]);
            maxY = Math.max(maxY, positions[i + 1]);
            minZ = Math.min(minZ, positions[i + 2]);
            maxZ = Math.max(maxZ, positions[i + 2]);
          }

          console.log("    - Rango X:", minX.toFixed(2), "a", maxX.toFixed(2), "| Ancho:", (maxX - minX).toFixed(2));
          console.log("    - Rango Y:", minY.toFixed(2), "a", maxY.toFixed(2), "| Alto:", (maxY - minY).toFixed(2));
          console.log("    - Rango Z:", minZ.toFixed(2), "a", maxZ.toFixed(2), "| Profundo:", (maxZ - minZ).toFixed(2));

          // Mapa de zonas del cuerpo (basado en Z que es la altura)
          console.log("    📍 Mapa de zonas aproximadas:");
          console.log("       🟡 Hombros:  z > 1.65 (parte superior)");
          console.log("       🔴 Pecho:    1.35 < z ≤ 1.65");
          console.log("       🔵 Espalda:  1.15 < z ≤ 1.35");
          console.log("       🟢 Cintura:  0.90 < z ≤ 1.15");
          console.log("       🟣 Cadera:   0.50 < z ≤ 0.90");

          // Determinar cuál eje es la altura
          const rangeX = maxX - minX;
          const rangeY = maxY - minY;
          const rangeZ = maxZ - minZ;

          if (rangeZ > rangeX && rangeZ > rangeY) {
            console.log("    ⚠️ ALTURA está en eje Z (modelo rotado)");
          } else if (rangeY > rangeX && rangeY > rangeZ) {
            console.log("    ✅ ALTURA está en eje Y (estándar)");
          } else {
            console.log("    ⚠️ ALTURA está en eje X (modelo rotado 90°)");
          }
        }
      });

      applyBodyScaling();

      console.log("✅ Avatar GLTF posicionado y listo");
    },
    (xhr) => {
      if (xhr.total > 0) {
        const percent = Math.round((xhr.loaded / xhr.total) * 100);
        console.log(`📦 Cargando GLTF: ${percent}%`);
      }
    },
    (err) => {
      console.warn("⚠️ No se pudo cargar scene.gltf:", err);
      console.log("✅ Usando modelo de prueba");
    }
  );

  // ===============================
  // MODELO DE PRUEBA
  // ===============================
  function createTestAvatar() {
    const group = new THREE.Group();

    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdbac,
      roughness: 0.5,
      metalness: 0.1
    });

    const clothMaterial = new THREE.MeshStandardMaterial({
      color: 0xd41152,
      roughness: 0.7,
      metalness: 0.2
    });

    // Cabeza
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 32, 32),
      skinMaterial
    );
    head.position.y = 1.5;
    head.castShadow = true;
    group.add(head);

    // Cuello
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 0.15, 16),
      skinMaterial
    );
    neck.position.y = 1.3;
    group.add(neck);

    // Torso superior (pecho)
    const chest = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.35, 0.25),
      clothMaterial
    );
    chest.position.y = 1.0;
    group.add(chest);

    // Torso inferior
    const belly = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.25, 0.23),
      clothMaterial
    );
    belly.position.y = 0.7;
    group.add(belly);

    // Cintura
    const waist = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.18, 0.3, 32),
      new THREE.MeshStandardMaterial({ color: 0x1e40af })
    );
    waist.position.y = 0.35;
    group.add(waist);

    // Caderas
    const hips = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.2, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x1e3a8a })
    );
    hips.position.y = 0.05;
    group.add(hips);

    // Piernas
    const legGeometry = new THREE.CylinderGeometry(0.08, 0.07, 0.9, 16);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x334155 });

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.12, -0.5, 0);
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.12, -0.5, 0);
    group.add(rightLeg);

    // Brazos
    const armGeometry = new THREE.CylinderGeometry(0.05, 0.045, 0.5, 16);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.25, 0.95, 0);
    leftArm.rotation.z = 0.2;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.25, 0.95, 0);
    rightArm.rotation.z = -0.2;
    group.add(rightArm);

    avatar = group;
    scene.add(avatar);
    console.log('✅ Modelo de prueba creado y agregado');

    applyBodyScaling();
  }

  // ===============================
  // SISTEMA DE PRENDAS
  // ===============================

  // Función para crear una camiseta
  function crearCamiseta(color = 0x3b82f6) {
    const group = new THREE.Group();
    group.name = 'camiseta';

    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.8,
      metalness: 0.1
    });

    // Torso de la camiseta
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.5, 0.26),
      material
    );
    torso.position.set(0, 0, 1.35);
    torso.rotation.x = Math.PI / 2;
    group.add(torso);

    // Mangas
    const mangaGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 16);
    mangaGeometry.rotateZ(Math.PI / 2);

    const mangaIzq = new THREE.Mesh(mangaGeometry, material);
    mangaIzq.position.set(-0.35, 0, 1.4);
    mangaIzq.rotation.z = 0.3;
    group.add(mangaIzq);

    const mangaDer = new THREE.Mesh(mangaGeometry, material);
    mangaDer.position.set(0.35, 0, 1.4);
    mangaDer.rotation.z = -0.3;
    group.add(mangaDer);

    return group;
  }

  // Función para crear pantalones
  function crearPantalon(color = 0x1e3a8a) {
    const group = new THREE.Group();
    group.name = 'pantalon';

    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.9,
      metalness: 0.05
    });

    // Parte superior del pantalón
    const cadera = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.25, 0.32),
      material
    );
    cadera.position.set(0, 0, 0.75);
    cadera.rotation.x = Math.PI / 2;
    group.add(cadera);

    // Piernas
    const piernaGeometry = new THREE.CylinderGeometry(0.09, 0.08, 0.7, 16);
    piernaGeometry.rotateX(Math.PI / 2);

    const piernaIzq = new THREE.Mesh(piernaGeometry, material);
    piernaIzq.position.set(-0.13, 0, 0.35);
    group.add(piernaIzq);

    const piernaDer = new THREE.Mesh(piernaGeometry, material);
    piernaDer.position.set(0.13, 0, 0.35);
    group.add(piernaDer);

    return group;
  }

  // Función para crear vestido
  function crearVestido(color = 0xd41152) {
    const group = new THREE.Group();
    group.name = 'vestido';

    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
      metalness: 0.2
    });

    // Parte superior del vestido
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.6, 0.26),
      material
    );
    torso.position.set(0, 0, 1.3);
    torso.rotation.x = Math.PI / 2;
    group.add(torso);

    // Falda (forma cónica)
    const falda = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 0.6, 32),
      material
    );
    falda.position.set(0, 0, 0.7);
    falda.rotation.x = Math.PI / 2;
    group.add(falda);

    return group;
  }

  // Función para crear chaqueta
  function crearChaqueta(color = 0x374151) {
    const group = new THREE.Group();
    group.name = 'chaqueta';

    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.6,
      metalness: 0.3
    });

    // Torso de la chaqueta (un poco más grande que la camiseta)
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.55, 0.28),
      material
    );
    torso.position.set(0, 0, 1.35);
    torso.rotation.x = Math.PI / 2;
    group.add(torso);

    // Mangas largas
    const mangaGeometry = new THREE.CylinderGeometry(0.09, 0.08, 0.4, 16);
    mangaGeometry.rotateZ(Math.PI / 2);

    const mangaIzq = new THREE.Mesh(mangaGeometry, material);
    mangaIzq.position.set(-0.38, 0, 1.4);
    mangaIzq.rotation.z = 0.3;
    group.add(mangaIzq);

    const mangaDer = new THREE.Mesh(mangaGeometry, material);
    mangaDer.position.set(0.38, 0, 1.4);
    mangaDer.rotation.z = -0.3;
    group.add(mangaDer);

    return group;
  }

  // Función para vestir/quitar prenda
  function vestirPrenda(tipo, color) {
    // Quitar prenda existente del mismo tipo
    if (state.prendas[tipo]) {
      scene.remove(state.prendas[tipo]);
      state.prendas[tipo] = null;
    }

    // Crear nueva prenda
    let prenda;
    switch (tipo) {
      case 'camiseta':
        prenda = crearCamiseta(color);
        break;
      case 'pantalon':
        prenda = crearPantalon(color);
        break;
      case 'vestido':
        prenda = crearVestido(color);
        // Si hay vestido, quitar camiseta y pantalón
        if (state.prendas.camiseta) {
          scene.remove(state.prendas.camiseta);
          state.prendas.camiseta = null;
        }
        if (state.prendas.pantalon) {
          scene.remove(state.prendas.pantalon);
          state.prendas.pantalon = null;
        }
        break;
      case 'chaqueta':
        prenda = crearChaqueta(color);
        break;
    }

    if (prenda) {
      scene.add(prenda);
      state.prendas[tipo] = prenda;
      aplicarEscalaAPrenda(prenda);
      console.log(`👕 Prenda agregada: ${tipo}`);
    }
  }

  // Función para quitar prenda
  function quitarPrenda(tipo) {
    if (state.prendas[tipo]) {
      scene.remove(state.prendas[tipo]);
      state.prendas[tipo] = null;
      console.log(`👕 Prenda removida: ${tipo}`);
    }
  }
  function aplicarEscalaAPrenda(prenda) {
    if (!prenda || !avatar) return;

    const shoulderScale = 1 + (state.hombros - 40) * 0.012;
    const chestScale = 1 + (state.pecho - 92) * 0.010;
    const waistScale = 1 + (state.cintura - 70) * 0.013;
    const hipScale = 1 + (state.cadera - 98) * 0.012;

    // ===== DETECCIÓN DE MODELO (solo una vez) =====
    const nombreModelo = (prenda.userData?.nombreModelo || '').toLowerCase();
    const archivoGlb = (prenda.userData?.archivoGlb || '').toLowerCase();

    const esFiesta = nombreModelo.includes('fiesta') ||
      nombreModelo.includes('party') ||
      archivoGlb.includes('party');

    const esEjecutivo = nombreModelo.includes('ejecutivo') ||
      archivoGlb.includes('dress.glb');

    // ===== DEFORMACIÓN POR VÉRTICES =====
    prenda.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;

      const geometry = child.geometry;
      const positions = geometry.attributes.position.array;

      if (!child.userData.originalPositions) {
        child.userData.originalPositions = new Float32Array(positions);
      }

      const original = child.userData.originalPositions;

      for (let i = 0; i < original.length; i += 3) {
        const x = original[i];
        const y = original[i + 1];
        const z = original[i + 2];

        let s = 1;

        if (esFiesta || esEjecutivo) {
          // Modelos con altura en Y — no deformar vértices
          s = 1;
        } else {
          // Floral Blanco (NO TOCAR)
          if (z > 1.35) s = shoulderScale;
          else if (z > 0.90) s = waistScale;
          else if (z > 0.50) s = hipScale;
        }

        positions[i] = x * s;
        positions[i + 1] = y;
        positions[i + 2] = z;
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
    });

    // ===== ESCALA GENERAL =====
    if (esFiesta || esEjecutivo) {
      // Modelos con altura en Y (Fiesta / Ejecutivo)
      const base = prenda.userData.baseScale || 1;
      const factor = (waistScale + hipScale) / 2;
      prenda.scale.set(base * factor, base, base * factor);
    } else {
      // Floral Blanco (NO TOCAR)
      const generalScale = (waistScale + hipScale) / 2 * 0.89;
      prenda.scale.set(generalScale, 1.0, generalScale);
    }

    // ===== POSICIÓN (separada por modelo) =====
    if (!prenda.userData.initialOffset) {
      const boxPrenda = new THREE.Box3().setFromObject(prenda);
      const boxAvatar = new THREE.Box3().setFromObject(avatar);

      if (esFiesta) {
        // Fiesta (NO TOCAR)
        prenda.userData.initialOffset = boxAvatar.min.y - boxPrenda.min.y - 0.06;
      } else if (esEjecutivo) {
        // Ejecutivo — bajar
        prenda.userData.initialOffset = boxAvatar.min.y - boxPrenda.min.y - 0.68;
      } else {
        // Floral Blanco (NO TOCAR)
        prenda.userData.initialOffset = boxAvatar.min.y - boxPrenda.min.y + 0.03;
      }
    }

    prenda.position.y = avatar.position.y + prenda.userData.initialOffset;
    prenda.position.x = avatar.position.x;

    if (esFiesta || esEjecutivo) {
      prenda.position.z = avatar.position.z + 0.00;
    } else {
      // Floral Blanco
      prenda.position.z = avatar.position.z + 0.60;
    }

    console.log(
      `👗 Prenda ajustada | ${esFiesta ? 'Fiesta' : esEjecutivo ? 'Ejecutivo' : 'Floral'} | Offset: ${prenda.userData.initialOffset?.toFixed(3)}`
    );
  }
  // ===============================
  // DEFORMACIÓN POR ZONAS
  // ===============================
  // ============================================================
  // ESCALADO DEL AVATAR
  // ============================================================
  function applyBodyScaling() {

    if (!avatar) return;

    // ==========================================================
    // ESCALAS DEL CUERPO
    // ==========================================================

    const shoulderScale =
      1 + (state.hombros - 40) * 0.015;

    const chestScale =
      1 + (state.pecho - 92) * 0.012;

    const backScale =
      1 + (state.espalda - 38) * 0.015;

    const waistScale =
      1 + (state.cintura - 70) * 0.010;

    const hipScale =
      1 + (state.cadera - 98) * 0.012;

    console.log("🔧 Aplicando escalas:", {
      shoulderScale,
      chestScale,
      backScale,
      waistScale,
      hipScale
    });

    // ==========================================================
    // AVATAR
    // ==========================================================

    avatar.traverse((child) => {

      if (!child.isMesh) return;

      const geometry = child.geometry;
      if (
        !geometry ||
        !geometry.attributes ||
        !geometry.attributes.position
      ) {
        return;
      }

      const positions =
        geometry.attributes.position.array;

      // ========================================================
      // GUARDAR POSICIONES ORIGINALES
      // ========================================================

      if (!child.userData.originalPositions) {

        child.userData.originalPositions =
          new Float32Array(positions);
      }

      const origPos =
        child.userData.originalPositions;

      // ========================================================
      // DEFORMACIÓN DEL AVATAR
      //
      // IMPORTANTE:
      // El avatar está rotado.
      // Z = ALTURA
      //
      // Esta parte pertenece al AVATAR.
      // NO tiene lógica de Fiesta.
      // ========================================================

      for (let i = 0; i < positions.length; i += 3) {

        const x = origPos[i];
        const y = origPos[i + 1];
        const z = origPos[i + 2];

        let scaleX = 1;
        let scaleY = 1;

        // ------------------------------------------------------
        // Solo torso central
        // ------------------------------------------------------

        const isBodyCenter =
          Math.abs(x) < 0.4;

        if (isBodyCenter) {

          // ====================================================
          // HOMBROS
          // ====================================================

          if (z > 1.65 && z <= 2.0) {

            scaleX = shoulderScale;
            scaleY = shoulderScale;
          }

          // ====================================================
          // PECHO
          // ====================================================

          else if (z > 1.29 && z <= 1.65) {

            scaleX = chestScale;
            scaleY = chestScale;
          }

          // ====================================================
          // ESPALDA / TORSO MEDIO
          // ====================================================

          else if (z > 1.32 && z <= 1.35) {

            scaleX = backScale;
            scaleY = backScale;
          }

          // ====================================================
          // CINTURA
          // ====================================================

          else if (z > 0.99 && z <= 1.32) {

            scaleX = waistScale;
            scaleY = waistScale;
          }

          // ====================================================
          // CADERA
          // ====================================================

          else if (z > 0.02 && z <= 0.99) {

            scaleX = hipScale;
            scaleY = hipScale;
          }
        }

        // ======================================================
        // APLICAR ESCALA
        //
        // X = ancho
        // Y = profundidad
        // Z = altura → NO TOCAR
        // ======================================================

        positions[i] =
          x * scaleX;

        positions[i + 1] =
          y * scaleY;

        positions[i + 2] =
          z;
      }

      // ========================================================
      // ACTUALIZAR GEOMETRÍA
      // ========================================================

      geometry.attributes.position.needsUpdate = true;

      geometry.computeVertexNormals();
    });

    // ==========================================================
    // ACTUALIZAR PRENDAS
    //
    // Esta llamada sí debe permanecer.
    // Aquí se procesa Floral Blanco o Fiesta según corresponda.
    // ==========================================================

    Object.values(state.prendas).forEach((prenda) => {

      if (prenda) {
        aplicarEscalaAPrenda(prenda);
      }

    });
  }

  // ===============================
  // SLIDERS
  // ===============================
  document.querySelectorAll("input[type=range]").forEach((input) => {
    input.addEventListener("input", (e) => {
      const key = e.target.dataset.key;
      const value = Number(e.target.value);

      state[key] = value;
      applyBodyScaling();

      const guide = document.getElementById("g-" + key);
      if (guide) {
        guide.textContent = value + " cm";

        // Efecto visual de feedback
        guide.style.transform = 'scale(1.2)';
        guide.style.transition = 'transform 0.1s ease';
        setTimeout(() => {
          guide.style.transform = 'scale(1)';
        }, 150);
      }

      // Log para verificar cambios
      console.log(`📏 ${key}: ${value} cm`, `Scale: ${key === 'hombros' ? (1 + (value - 40) * 0.015).toFixed(2) :
        key === 'pecho' ? (1 + (value - 92) * 0.012).toFixed(2) :
          key === 'espalda' ? (1 + (value - 38) * 0.015).toFixed(2) :
            key === 'cintura' ? (1 + (value - 70) * 0.025).toFixed(2) :
              (1 + (value - 98) * 0.012).toFixed(2)
        }x`);
    });
  });

  console.log('✅ Sliders conectados');

  // ===============================
  // BOTONES DE VISTA
  // ===============================
  document.querySelectorAll(".view").forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;

      document.querySelectorAll(".view").forEach(b => {
        b.classList.remove('bg-primary');
        b.classList.add('bg-surface');
      });

      btn.classList.remove('bg-surface');
      btn.classList.add('bg-primary');

      if (view === "front") state.rotationY = Math.PI;
      if (view === "side") state.rotationY = Math.PI / 2;
      if (view === "back") state.rotationY = 0;

      if (avatar) avatar.rotation.y = state.rotationY;
    });
  });

  console.log('✅ Botones de vista conectados');

  // ===============================
  // ROTACIÓN CON MOUSE + PRENDAS
  // ===============================
  let dragging = false;
  let lastX = 0;

  renderer.domElement.addEventListener("mousedown", (e) => {
    dragging = true;
    lastX = e.clientX;
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging || !avatar) return;

    const delta = (e.clientX - lastX) * 0.005;
    avatar.rotation.y += delta;
    state.rotationY = avatar.rotation.y;

    // Sincronizar rotación de TODAS las prendas
    Object.values(state.prendas).forEach(prenda => {
      if (prenda) {
        prenda.rotation.y = avatar.rotation.y;
      }
    });

    lastX = e.clientX;
  });

  console.log('✅ Controles de rotación conectados (con prendas)');

  // ===============================
  // LOOP DE ANIMACIÓN
  // ===============================
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  animate();
  console.log('✅ Loop de animación iniciado');

  // ===============================
  // RESPONSIVE
  // ===============================
  window.addEventListener("resize", () => {
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });
  // ==================== CARGAR PRENDA DESDE CATÁLOGO ====================
  function cargarPrendaDesdeCatalogo() {
    const prendaData = localStorage.getItem('prendaSeleccionada');
    if (!prendaData) return;

    const prenda = JSON.parse(prendaData);

    console.log(`👕 Cargando prenda desde catálogo: ${prenda.nombre}`);

    // Vestir la prenda
    vestirPrenda(prenda.tipo, prenda.color);

    // Limpiar para no volver a cargar
    // localStorage.removeItem('prendaSeleccionada'); // Descomenta si quieres que solo se cargue una vez
  }

  // Llamar al cargar la página
  window.addEventListener('load', () => {
    cargarPrendaDesdeCatalogo();
    setTimeout(() => cargarModeloCatalogo(), 2000);
  });
  console.log('🎉 Avatar 3D Engine completamente inicializado!');
  // ===============================
  // CARGAR MODELO GLB DESDE CATÁLOGO
  // ===============================
  function cargarModeloCatalogo() {
    const raw = sessionStorage.getItem('brit_modelo_seleccionado');
    if (!raw) return;

    let modelo;
    try { modelo = JSON.parse(raw); } catch { return; }
    sessionStorage.removeItem('brit_modelo_seleccionado');

    console.log('👗 Cargando modelo del catálogo:', modelo.nombre);

    const glbLoader = new GLTFLoader();
    const ruta = modelo.archivo_glb;

    glbLoader.load(ruta,
      (gltf) => {
        // Quitar prenda anterior si existe
        if (state.prendas.catalogo) {
          scene.remove(state.prendas.catalogo);
        }

        const prenda = gltf.scene;

        // Escalar al tamaño del avatar
        const boxPrenda = new THREE.Box3().setFromObject(prenda);
        const boxAvatar = new THREE.Box3().setFromObject(avatar);
        const sizePrenda = new THREE.Vector3();
        const sizeAvatar = new THREE.Vector3();
        boxPrenda.getSize(sizePrenda);
        boxAvatar.getSize(sizeAvatar);

        const escala = (sizeAvatar.y / sizePrenda.y) * 0.85;
        prenda.scale.setScalar(escala);
        prenda.userData.baseScale = escala; // ← guardar escala original
        // Posicionar sobre el avatar
        const box2 = new THREE.Box3().setFromObject(prenda);
        prenda.position.y = -box2.min.y + avatar.position.y;
        prenda.position.x = avatar.position.x;
        prenda.position.z = avatar.position.z + 0.01;
        prenda.rotation.y = avatar.rotation.y;

        scene.add(prenda);

        // Guardar posiciones originales ANTES de cualquier deformación
        prenda.traverse((child) => {
          if (child.isMesh && child.geometry) {
            child.userData.originalPositions = new Float32Array(
              child.geometry.attributes.position.array
            );
            child.userData.esPrenda = true;
          }
        });

        state.prendas.catalogo = prenda;

        // Mostrar nombre en header
        const header = document.querySelector('header h1');
        if (header) header.textContent = `BRITASGG — ${modelo.nombre}`;
        prenda.userData.archivoGlb = modelo.archivo_glb;
        prenda.userData.nombreModelo = modelo.nombre;
        prenda.traverse((child) => {
          if (child.isMesh && child.geometry) {
            const pos = child.geometry.attributes.position.array;
            let minZ = Infinity, maxZ = -Infinity;
            let minY = Infinity, maxY = -Infinity;

            for (let i = 0; i < pos.length; i += 3) {
              const y = pos[i + 1];
              const z = pos[i + 2];
              if (z < minZ) minZ = z;
              if (z > maxZ) maxZ = z;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }

            console.log(`🔍 Mesh: ${child.name} | Z: ${minZ.toFixed(2)} a ${maxZ.toFixed(2)} | Y: ${minY.toFixed(2)} a ${maxY.toFixed(2)}`);
          }
        });
        console.log('✅ Modelo GLB cargado:', modelo.nombre);
      },
      undefined,
      (err) => {
        console.error('❌ Error cargando GLB:', err);
      }
    );
  }


  // ← AQUÍ pegas cargarCabello (después del } de arriba)

  function cargarCabello(ruta = 'models/cabello/long_reddish_hair_for_game.glb') {
    if (!avatar) {
      console.warn('⚠️ Avatar aún no cargado');
      return;
    }

    const loader = new GLTFLoader();

    loader.load(ruta, (gltf) => {
      if (state.cabello) {
        scene.remove(state.cabello);
      }

      const cabello = gltf.scene;

      const boxCabello = new THREE.Box3().setFromObject(cabello);
      const sizeCabello = new THREE.Vector3();
      boxCabello.getSize(sizeCabello);

      const boxAvatar = new THREE.Box3().setFromObject(avatar);
      const sizeAvatar = new THREE.Vector3();
      boxAvatar.getSize(sizeAvatar);

      const escala = (sizeAvatar.y / sizeCabello.y) * 0.35;
      cabello.scale.setScalar(escala);

      const box2 = new THREE.Box3().setFromObject(cabello);
      cabello.position.x = avatar.position.x;
      cabello.position.y = avatar.position.y + sizeAvatar.y * 0.72;
      cabello.position.z = avatar.position.z;
      cabello.rotation.y = avatar.rotation.y;

      scene.add(cabello);
      state.cabello = cabello;

      console.log('💇 Cabello cargado');
    }, undefined, (err) => {
      console.error('❌ Error cargando cabello:', err);
    });
  }

  window.cargarCabello = cargarCabello;
  window.quitarCabello = function () {
    if (state.cabello) {
      scene.remove(state.cabello);
      state.cabello = null;
    }
  };
}
