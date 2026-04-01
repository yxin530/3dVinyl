import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Play, Pause, Search, Disc3, SkipBack, SkipForward } from 'lucide-react';

interface Album {
  id: number;
  title: string;
  artist: string;
  year: string;
  thumbUrl: string;
  artUrl: string;
}

interface Track {
  trackId: number;
  trackName: string;
  artistName: string;
  previewUrl: string;
  trackNumber: number;
}

export default function App() {
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [query, setQuery] = useState('');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState('iTunes · no login required');
  
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [rpm, setRpm] = useState(33.3);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const threeState = useRef<any>(null);

  // Initialize Audio
  useEffect(() => {
audioRef.current = new Audio();
audioRef.current.crossOrigin = "anonymous"; 
audioRef.current.volume = 0.5;
    
    const handleEnded = () => {
      setCurrentTrackIndex(prev => {
        if (prev < tracks.length - 1) {
          return prev + 1;
        }
        setIsPlaying(false);
        return prev;
      });
    };
    
    audioRef.current.addEventListener('ended', handleEnded);
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.pause();
      }
    };
  }, [tracks.length]);

  // Handle track changes
  useEffect(() => {
    if (tracks.length > 0 && audioRef.current) {
      const track = tracks[currentTrackIndex];
      if (track && track.previewUrl) {
        audioRef.current.src = track.previewUrl;
        if (isPlaying) {
          audioRef.current.play().catch(console.error);
        }
      }
    }
  }, [currentTrackIndex, tracks]);

  // Handle play/pause
  useEffect(() => {
    if (audioRef.current && tracks.length > 0) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
    
    if (threeState.current) {
      threeState.current.setIsPlaying(isPlaying);
    }
  }, [isPlaying, tracks.length]);

  // Initialize Three.js
  useEffect(() => {
    if (!canvasRef.current || !canvasWrapRef.current) return;
    
    const canvas = canvasRef.current;
    const wrap = canvasWrapRef.current;
    
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // @ts-ignore
    renderer.outputEncoding = THREE.sRGBEncoding;
    // @ts-ignore
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#C4A484');
    scene.fog = new THREE.FogExp2('#C4A484', 0.04);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 4.5, 7);
    camera.lookAt(0, 0, 0);

    const resizeRenderer = () => {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resizeRenderer();
    window.addEventListener('resize', resizeRenderer);

    // Lighting
    const ambient = new THREE.AmbientLight(0xfff5e0, 0.4);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xfff0d0, 1.2);
    key.position.set(4, 8, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x2a2010, 0.5);
    fill.position.set(-5, 2, -3);
    scene.add(fill);

    const spot = new THREE.SpotLight(0xffd080, 1.5, 20, Math.PI / 8, 0.5, 1.5);
    spot.position.set(0, 10, 0);
    spot.target.position.set(0, 0, 0);
    scene.add(spot);
    scene.add(spot.target);

    // Floor
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x080705, roughness: 0.9, metalness: 0.1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.8;
    floor.receiveShadow = true;
    scene.add(floor);

    // Turntable plinth (Wooden)
    const plinthGeo = new THREE.BoxGeometry(5.5, 0.3, 5.5);
    const plinthMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.85, metalness: 0.05 });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.y = -0.55;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    scene.add(plinth);

    // Platter (Metal)
    const platterGeo = new THREE.CylinderGeometry(2.4, 2.4, 0.12, 64);
    const platterMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.3, metalness: 0.85 });
    const platter = new THREE.Mesh(platterGeo, platterMat);
    platter.position.y = -0.38;
    platter.castShadow = true;
    platter.receiveShadow = true;
    scene.add(platter);

    // Spindle
    const spindleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.25, 16);
    const spindleMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.2, metalness: 0.9 });
    const spindle = new THREE.Mesh(spindleGeo, spindleMat);
    spindle.position.y = -0.19;
    scene.add(spindle);

    // Vinyl record group
    const recordGroup = new THREE.Group();
    recordGroup.position.y = -0.28;
    scene.add(recordGroup);

    const discGeo = new THREE.CylinderGeometry(2.3, 2.3, 0.06, 128);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x050505, roughness: 0.3, metalness: 0.6
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.castShadow = true;
    recordGroup.add(disc);

    for (let r = 0.65; r < 2.25; r += 0.055) {
      const torusGeo = new THREE.TorusGeometry(r, 0.003, 4, 128);
      const torusMat = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.8 });
      const torus = new THREE.Mesh(torusGeo, torusMat);
      torus.rotation.x = Math.PI / 2;
      torus.position.y = 0.031;
      recordGroup.add(torus);
      const torusB = torus.clone();
      torusB.position.y = -0.031;
      recordGroup.add(torusB);
    }

    const labelGeo = new THREE.CylinderGeometry(0.62, 0.62, 0.065, 64);
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 512;
    labelCanvas.height = 512;
    const lctx = labelCanvas.getContext('2d')!;
    
    const drawDefaultLabel = () => {
      lctx.fillStyle = '#1a1408';
      lctx.fillRect(0, 0, 512, 512);
      lctx.strokeStyle = '#c9a84c44';
      lctx.lineWidth = 2;
      for (let r = 40; r < 256; r += 18) {
        lctx.beginPath(); lctx.arc(256, 256, r, 0, Math.PI*2); lctx.stroke();
      }
      lctx.fillStyle = '#c9a84c';
      lctx.font = 'bold 28px serif';
      lctx.textAlign = 'center';
      lctx.fillText('VINYL', 256, 248);
      lctx.fillStyle = '#7a6428';
      lctx.font = '16px monospace';
      lctx.fillText('ARCHIVE', 256, 280);
    };
    drawDefaultLabel();

    const labelTex = new THREE.CanvasTexture(labelCanvas);
    const labelMat = new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.6, metalness: 0.1 });
    const labelMesh = new THREE.Mesh(labelGeo, [discMat, labelMat, discMat]);
    labelMesh.position.y = 0.002;
    recordGroup.add(labelMesh);

    const holeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.1, 16);
    const holeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const holeMesh = new THREE.Mesh(holeGeo, holeMat);
    holeMesh.position.y = 0.002;
    recordGroup.add(holeMesh);

    // Tone arm assembly
    const armGroup = new THREE.Group();
    armGroup.position.set(2.6, -0.2, 0); // Pivot point
    scene.add(armGroup);

    // Arm base (fixed)
    const baseGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.18, 16);
    const armMat  = new THREE.MeshStandardMaterial({ color: 0x8a7d6a, roughness: 0.4, metalness: 0.7 });
    const armBase = new THREE.Mesh(baseGeo, armMat);
    armBase.position.set(2.6, -0.22, 0);
    scene.add(armBase);

    // Pivot post (fixed)
    const postGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.22, 12);
    const post = new THREE.Mesh(postGeo, armMat);
    post.position.set(2.6, -0.05, 0);
    scene.add(post);

    // Main arm tube (S-shape)
    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.12, 0),
      new THREE.Vector3(0.2, 0.14, 0.8),
      new THREE.Vector3(0.1, 0.13, 1.6),
      new THREE.Vector3(-0.2, 0.12, 2.4),
    ]);
    const armTubeGeo = new THREE.TubeGeometry(armCurve, 32, 0.025, 8, false);
    const armTubeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.2, metalness: 0.9 });
    const armTube = new THREE.Mesh(armTubeGeo, armTubeMat);
    armGroup.add(armTube);

    // Counterweight
    const cwGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.25, 16);
    const cwMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.8 });
    const cw = new THREE.Mesh(cwGeo, cwMat);
    cw.rotation.x = Math.PI / 2;
    cw.position.set(0, 0.12, -0.3);
    armGroup.add(cw);

    // Anti-skate dial
    const dialGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16);
    const dial = new THREE.Mesh(dialGeo, cwMat);
    dial.position.set(0.15, 0.05, 0);
    armGroup.add(dial);

    // Headshell Group
    const headshellGroup = new THREE.Group();
    headshellGroup.position.set(-0.2, 0.12, 2.4);
    headshellGroup.rotation.y = 0.4; 
    armGroup.add(headshellGroup);

    // Headshell connector
    const hsConnGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.06, 16);
    const hsConn = new THREE.Mesh(hsConnGeo, armTubeMat);
    hsConn.rotation.x = Math.PI / 2;
    hsConn.position.set(0, 0, 0.03);
    headshellGroup.add(hsConn);

    // Headshell body
    const hsBodyGeo = new THREE.BoxGeometry(0.15, 0.04, 0.25);
    const hsBodyMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8, metalness: 0.2 });
    const hsBody = new THREE.Mesh(hsBodyGeo, hsBodyMat);
    hsBody.position.set(0, 0, 0.15);
    headshellGroup.add(hsBody);

    // Cartridge (Red)
    const cartGeo = new THREE.BoxGeometry(0.1, 0.08, 0.18);
    const cartMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.4, metalness: 0.1 });
    const cart = new THREE.Mesh(cartGeo, cartMat);
    cart.position.set(0, -0.06, 0.15);
    headshellGroup.add(cart);

    // Stylus (Needle)
    const stylusGeo = new THREE.CylinderGeometry(0.005, 0.001, 0.06, 8);
    const stylusMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.1, metalness: 1.0 });
    const stylus = new THREE.Mesh(stylusGeo, stylusMat);
    stylus.position.set(0, -0.12, 0.2);
    stylus.rotation.x = 0.2;
    headshellGroup.add(stylus);

    // Orbit controls (manual)
    let isDragging = false, lastMX = 0, lastMY = 0;
    let camTheta = Math.atan2(7, 0), camPhi = Math.atan2(4.5, Math.sqrt(49));
    let camRadius = 9;
    const camTarget = new THREE.Vector3(0, 0, 0);

    const updateCamera = () => {
      camera.position.x = camTarget.x + camRadius * Math.sin(camTheta) * Math.cos(camPhi);
      camera.position.y = camTarget.y + camRadius * Math.sin(camPhi);
      camera.position.z = camTarget.z + camRadius * Math.cos(camTheta) * Math.cos(camPhi);
      camera.lookAt(camTarget);
    };
    updateCamera();

    const onMouseDown = (e: MouseEvent) => { isDragging = true; lastMX = e.clientX; lastMY = e.clientY; };
    const onMouseUp = () => isDragging = false;
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastMX, dy = e.clientY - lastMY;
      camTheta -= dx * 0.008;
      camPhi   = Math.max(0.1, Math.min(Math.PI/2 - 0.05, camPhi + dy * 0.006));
      lastMX = e.clientX; lastMY = e.clientY;
      updateCamera();
    };
    const onWheel = (e: WheelEvent) => {
      camRadius = Math.max(3, Math.min(18, camRadius + e.deltaY * 0.01));
      updateCamera();
      e.preventDefault();
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    // Touch support
    let lastTouchX = 0, lastTouchY = 0;
    const onTouchStart = (e: TouchEvent) => { lastTouchX = e.touches[0].clientX; lastTouchY = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - lastTouchX, dy = e.touches[0].clientY - lastTouchY;
      camTheta -= dx * 0.008;
      camPhi = Math.max(0.1, Math.min(Math.PI/2 - 0.05, camPhi + dy * 0.006));
      lastTouchX = e.touches[0].clientX; lastTouchY = e.touches[0].clientY;
      updateCamera();
      e.preventDefault();
    };
    canvas.addEventListener('touchstart', onTouchStart);
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });

    // State for animation
    let isPlayingState = false;
    let currentRpm = 33.3;
    let armRotation = 0;
    let targetArmRotation = 0;
    
    threeState.current = {
      setIsPlaying: (playing: boolean) => { isPlayingState = playing; },
      setRpm: (rpm: number) => { currentRpm = rpm; },
      setArmProgress: (progress: number) => {
        // progress: 0 to 1
        // ARM_PLAY_START = -0.6, ARM_PLAY_END = -1.2
        if (isNaN(progress)) progress = 0;
        targetArmRotation = -0.6 - (progress * 0.6);
      },
      stopArm: () => {
        targetArmRotation = 0;
      },
      applyAlbumArt: (url: string) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          lctx.clearRect(0, 0, 512, 512);
          lctx.save();
          lctx.beginPath();
          lctx.arc(256, 256, 256, 0, Math.PI * 2);
          lctx.clip();
          lctx.drawImage(img, 0, 0, 512, 512);
          lctx.restore();
          const grad = lctx.createRadialGradient(256,256,180, 256,256,256);
          grad.addColorStop(0, 'rgba(0,0,0,0)');
          grad.addColorStop(1, 'rgba(0,0,0,0.45)');
          lctx.fillStyle = grad;
          lctx.fillRect(0, 0, 512, 512);
          lctx.fillStyle = '#000';
          lctx.beginPath();
          lctx.arc(256, 256, 10, 0, Math.PI*2);
          lctx.fill();
          labelTex.needsUpdate = true;
        };
        img.onerror = () => {
          drawDefaultLabel();
          labelTex.needsUpdate = true;
        };
        img.src = url;
      }
    };

    const clock = new THREE.Clock();
    let animationId: number;
    
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const dt = clock.getDelta();

      if (isPlayingState) {
        recordGroup.rotation.y -= currentRpm * ((2 * Math.PI) / 60) * dt;
      }

      // Smoothly interpolate arm rotation
      if (Math.abs(armRotation - targetArmRotation) > 0.001) {
        armRotation += (targetArmRotation - armRotation) * Math.min(1, dt * 5);
        armGroup.rotation.y = armRotation;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeRenderer);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      renderer.dispose();
    };
  }, []);

  // Sync RPM
  useEffect(() => {
    if (threeState.current) {
      threeState.current.setRpm(rpm);
    }
  }, [rpm]);

  // Sync Audio Progress to Arm
  useEffect(() => {
    let interval: any;
    if (isPlaying && audioRef.current && tracks.length > 0) {
      interval = setInterval(() => {
        if (audioRef.current) {
          const duration = audioRef.current.duration || 30;
          const currentTime = audioRef.current.currentTime || 0;
          
          // Calculate overall progress across all tracks
          const trackProgress = currentTime / duration;
          const overallProgress = tracks.length > 0 ? (currentTrackIndex + trackProgress) / tracks.length : 0;
          
          if (threeState.current) {
            threeState.current.setArmProgress(overallProgress);
          }
        }
      }, 100);
    } else if (!isPlaying && threeState.current) {
      threeState.current.stopArm();
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, currentTrackIndex, tracks.length]);

  const searchITunes = async (q: string) => {
    setIsSearching(true);
    setSearchStatus('Searching...');
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=album&limit=30&media=music`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`iTunes returned ${res.status}`);
      const data = await res.json();

      const seen = new Set();
      const results: Album[] = (data.results || []).filter((r: any) => {
        if (seen.has(r.collectionId)) return false;
        seen.add(r.collectionId);
        return true;
      }).map((r: any) => ({
        id: r.collectionId,
        title: r.collectionName,
        artist: r.artistName,
        year: r.releaseDate?.slice(0, 4) || '',
        thumbUrl: r.artworkUrl100,
        artUrl: r.artworkUrl100?.replace('100x100bb', '600x600bb') || '',
      }));
      
      setAlbums(results);
      setSearchStatus(results.length ? `${results.length} results` : '0 results');
    } catch (err: any) {
      setSearchStatus('⚠ ' + err.message);
      setAlbums([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = () => {
    if (query.trim()) {
      searchITunes(query.trim());
    }
  };

  const selectAlbum = async (album: Album) => {
    setActiveAlbum(album);
    setIsPlaying(false);
    setCurrentTrackIndex(0);
    setTracks([]);
    
    if (threeState.current) {
      threeState.current.applyAlbumArt(album.artUrl);
    }
    
    // Fetch tracks for the album
    try {
      const url = `https://itunes.apple.com/lookup?id=${album.id}&entity=song`;
      const res = await fetch(url);
      const data = await res.json();
      
      const albumTracks = data.results
        .filter((r: any) => r.wrapperType === 'track' && r.previewUrl)
        .map((r: any) => ({
          trackId: r.trackId,
          trackName: r.trackName,
          artistName: r.artistName,
          previewUrl: r.previewUrl,
          trackNumber: r.trackNumber
        }))
        .sort((a: any, b: any) => a.trackNumber - b.trackNumber);
        
      setTracks(albumTracks);
    } catch (err) {
      console.error('Failed to fetch tracks', err);
    }
  };

  const handlePrevTrack = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(prev => prev - 1);
    }
  };

  const handleNextTrack = () => {
    if (currentTrackIndex < tracks.length - 1) {
      setCurrentTrackIndex(prev => prev + 1);
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0905] text-[#e8e0cc] font-mono overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[360px] flex flex-col border-r border-[#2a2720] bg-[#111009] z-10 shrink-0">
        <div className="p-6 pb-5 border-b border-[#2a2720]">
          <h1 className="font-serif text-[22px] tracking-wide text-[#c9a84c] leading-tight flex items-center gap-2">
            <Disc3 className="w-6 h-6" /> Vinyl
          </h1>
          <p className="text-[10px] tracking-[0.15em] uppercase text-[#6b6355] mt-1">
            iTunes Search
          </p>
        </div>

        <div className="p-4 px-6 border-b border-[#2a2720]">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search albums..."
              className="flex-1 bg-[#0a0905] border border-[#2a2720] text-[#e8e0cc] text-[11px] p-2 px-3 rounded outline-none tracking-wide focus:border-[#7a6428] transition-colors"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="bg-[#c9a84c] text-[#0a0905] text-[10px] font-medium tracking-[0.12em] uppercase px-3 py-2 rounded hover:opacity-85 disabled:opacity-40 transition-opacity flex items-center justify-center"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
          <div className="text-[10px] text-[#6b6355] mt-2 min-h-[14px] tracking-wide">
            {searchStatus}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          {albums.length === 0 ? (
            <div className="p-10 text-center text-[#6b6355] text-[11px] tracking-wider leading-loose">
              Search any album above —<br />no login needed
            </div>
          ) : (
            albums.map(album => (
              <div
                key={album.id}
                onClick={() => selectAlbum(album)}
                className={`flex items-center gap-3 p-2.5 px-6 cursor-pointer transition-colors border-l-2 ${
                  activeAlbum?.id === album.id
                    ? 'bg-[#c9a84c1a] border-[#c9a84c]'
                    : 'border-transparent hover:bg-[#c9a84c0f]'
                }`}
              >
                <img
                  src={album.thumbUrl}
                  alt=""
                  className="w-10 h-10 rounded-sm object-cover bg-[#2a2720] shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="overflow-hidden">
                  <div className="font-serif text-[13px] text-[#e8e0cc] truncate">
                    {album.title}
                  </div>
                  <div className="text-[10px] text-[#6b6355] tracking-wide mt-0.5 truncate">
                    {album.artist} {album.year ? `· ${album.year}` : ''}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 px-6 border-t border-[#2a2720] min-h-[72px]">
          <div className="text-[9px] tracking-[0.18em] uppercase text-[#6b6355] mb-1.5">
            Now on the platter
          </div>
          <div className="font-serif text-[15px] text-[#c9a84c] truncate">
            {activeAlbum ? activeAlbum.title : '—'}
          </div>
          <div className="text-[10px] text-[#6b6355] tracking-wide mt-0.5 truncate flex justify-between">
            <span>{activeAlbum ? activeAlbum.artist : ''}</span>
            {tracks.length > 0 && (
              <span>Track {currentTrackIndex + 1} of {tracks.length}</span>
            )}
          </div>
          {tracks.length > 0 && (
            <div className="text-[11px] text-[#e8e0cc] mt-1 truncate">
              {tracks[currentTrackIndex]?.trackName}
            </div>
          )}
        </div>

        <div className="p-4 px-6 pb-6 border-t border-[#2a2720] flex items-center justify-center">
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={handlePrevTrack}
              disabled={!activeAlbum || tracks.length === 0 || currentTrackIndex === 0}
              className="w-10 h-10 rounded-full text-[#c9a84c] flex items-center justify-center hover:bg-[#c9a84c22] transition-colors disabled:opacity-40 disabled:hover:bg-transparent shrink-0"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={!activeAlbum || tracks.length === 0}
              className="w-14 h-14 rounded-full border border-[#c9a84c] text-[#c9a84c] flex items-center justify-center hover:bg-[#c9a84c] hover:text-[#0a0905] transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#c9a84c] shrink-0"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </button>
            <button
              onClick={handleNextTrack}
              disabled={!activeAlbum || tracks.length === 0 || currentTrackIndex === tracks.length - 1}
              className="w-10 h-10 rounded-full text-[#c9a84c] flex items-center justify-center hover:bg-[#c9a84c22] transition-colors disabled:opacity-40 disabled:hover:bg-transparent shrink-0"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* 3D Canvas */}
      <div ref={canvasWrapRef} className="relative flex-1 bg-[#C4A484] overflow-hidden">
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-5 right-6 text-[10px] tracking-[0.1em] text-[#5c4a3d] uppercase pointer-events-none">
          drag to orbit · scroll to zoom
        </div>
      </div>
    </div>
  );
}
