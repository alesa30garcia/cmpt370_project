class Game {
  constructor(state) {
    this.state = state;
    this.collidableSpheres = [];
    this.walls = [];
    this.dogs = [];          // convenient array of all dogs
    this.collected = 0;
    this.gameComplete = false;
    this.timesHit= 0;

    // NEW: first-person eye height (relative to the player's model origin/centroid)
    this.fpEyeHeight = 0.7;

    // NEW: optional extra FP tweak (keep 0 unless you want it forward/back/side)
    this.fpExtraOffset = vec3.fromValues(0, 0, 0);
  }

  // ---------- MATRIX-BASED DIRECTION VECTORS ----------
  getForwardVector(object) {
    return vec3.fromValues(
      -object.model.rotation[8],
      0,
      -object.model.rotation[10]
    );
  }

  getRightVector(object) {
    return vec3.fromValues(
      object.model.rotation[0],
      0,
      object.model.rotation[2]
    );
  }

  // ---------- MODEL MATRIX SYNC ----------
  syncModelMatrix(object) {
    if (!object || !object.model) return;

    if (!object.modelMatrix) object.modelMatrix = mat4.create();

    let R = mat4.create();
    if (object.model.rotation) {
      if (
        typeof object.model.rotation.length === "number" &&
        object.model.rotation.length === 16
      ) {
        R = mat4.fromValues(...object.model.rotation);
      } else {
        mat4.copy(R, object.model.rotation);
      }
    }

    const T = mat4.create();
    mat4.fromTranslation(T, object.model.position);

    const M = mat4.create();
    mat4.mul(M, T, R);
    mat4.scale(M, M, object.model.scale);

    mat4.copy(object.modelMatrix, M);
  }

  // ---------- FORCE HIDE/SHOW ROBBER ----------
  setRobberVisible(visible) {
    if (!this.robber) return;

    this.robber.render = !!visible;

    const idx = this.state.objects.indexOf(this.robber);
    if (!visible) {
      if (idx !== -1) this.state.objects.splice(idx, 1);
    } else {
      if (idx === -1) this.state.objects.push(this.robber);
    }

    this.syncModelMatrix(this.robber);
  }

  // ---------- SPHERE COLLIDERS ----------
  createSphereCollider(object, radius, onCollide = null) {
    object.collider = {
      type: "SPHERE",
      radius: radius * object.model.scale[0],
      centre: vec3.create(),
      onCollide: onCollide
        ? onCollide
        : (otherObject) => {
          console.log(`Collided with ${otherObject.name}`);
        },
    };

    // Don't add test colliders to the collidable objects list
    if (object !== this.robberTestCollider 
      && object.name !== "testDog" && object.name !== "testRobber") {
      this.collidableSpheres.push(object);
    }
  }

  updateSphereCentre(object) {
    var centre = vec3.create();

    // The robberTestCollider centre needs to be offset for more accurate wall collsion detection
    if (object.name == "robberTestCollider"){
    let offset = vec3.fromValues(-0.25,0,-0.25);
    vec3.add(offset, object.centroid, offset);
    vec3.add(centre, object.model.position, offset);
    object.collider.centre = centre;
  }
    
    else
    {
    vec3.add(centre, object.model.position, object.centroid);
    object.collider.centre = centre;
    }
  }

  // Check robber vs all other sphere colliders (dogs and collectibles)
  sphereCollision(object) {
    this.updateSphereCentre(object);

    this.collidableSpheres.forEach((otherObject) => {
      if (otherObject.name === object.name) return;

      this.updateSphereCentre(otherObject);
      let distance = vec3.distance(
        object.collider.centre,
        otherObject.collider.centre
      );
      let radiusSum = object.collider.radius + otherObject.collider.radius;

      if (distance < radiusSum) {
        if (
          object.name === "robber" &&
          otherObject.name.startsWith("dog")
        ) {
          // Robber got caught by a dog - play dog bark sound and move robber back to spawn 
          this.playSound("dogBark");
          this.timesHit += 1;
          this.playerCollision(otherObject);
          

          // Robber collected an item - play collection sound, increment item count and despawn object
        } else if (otherObject.name !== "testRobber") {
          this.playSound("collectionSound");
          this.collected += 1;
          const counter = document.getElementById("itemCounter");
          counter.textContent = "Items Collected: " + this.collected + "/5";
          console.log(this.collidableSpheres);
      
          game.despawnObject(otherObject);
     
          
        }
      }
    });
  }

  // ---------- BOX COLLIDERS ----------
  createBoxCollider(object, width, depth, onCollide = null) {
    object.collider = {
      type: "BOX",
      width: width,
      depth: depth,
      minX: 0,
      maxX: 0,
      minZ: 0,
      maxZ: 0,
      onCollide: onCollide
        ? onCollide
        : (otherObject) => {
          console.log(`Collided with ${otherObject.name}`);
        },
    };

    this.updateBoxCollider(object);
   
  }

  updateBoxCollider(object) {
    // Walls parallel with the z axis 
    if (object.model.scale[0] == 0.5) {
      var tempX = object.collider.maxX + object.collider.width / 2;
      var tempZ = object.collider.maxZ + object.collider.depth / 4;

    // Walls paralell with the x axis 
    } else if (object.model.scale[2] == 0.5) {
      var tempX = object.collider.maxX + object.collider.width / 4;
      var tempZ = object.collider.maxZ + object.collider.depth / 2;

    // Diamond Case - collision-wise it behaves like a wall, not letting the player pass through
    }
      else { 
      var tempX = object.collider.maxX + object.collider.width / 2;
      var tempZ = object.collider.maxZ + object.collider.depth / 2;
    }

    object.collider.minX = object.model.position[0] - tempX;
    object.collider.maxX = object.model.position[0] + tempX;

    object.collider.minZ = object.model.position[2] - tempZ;
    object.collider.maxZ = object.model.position[2] + tempZ;
  }

  boxSphereCollision(object) {
    this.updateSphereCentre(object);
    let collision = false;

    this.walls.forEach((wall) => {
      const x = Math.max(
        wall.collider.minX,
        Math.min(object.collider.centre[0], wall.collider.maxX)
      );
      const z = Math.max(
        wall.collider.minZ,
        Math.min(object.collider.centre[2], wall.collider.maxZ)
      );

      const dx = x - object.collider.centre[0];
      const dz = z - object.collider.centre[2];
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < object.collider.radius) collision = true;
    });

    return collision;
  }

  // ---------- WALL-CLIP PREVENTION ----------
  attemptMove(object, movementVec) {
    let testPos = vec3.clone(object.model.position);
    vec3.add(testPos, testPos, movementVec);

    let testObj = {
      name: "testRobber",
      model: { position: testPos, scale: object.model.scale },
      centroid: object.centroid,
    };

    let baseRadius = object.collider.radius / object.model.scale[0];
    this.createSphereCollider(testObj, baseRadius);
    this.updateSphereCentre(testObj);

    let collision = this.boxSphereCollision(testObj);

    if (!collision) {
      object.translate(movementVec);

      this.syncModelMatrix(object);

      if (this.cameraMode === "firstperson") {
        vec3.add(this.topDownView.position, this.topDownView.position, movementVec);
      }
    }
  }

  // ---------- ROTATION ----------
  // Object to rotate is either the robber or a dog
  // Robber turns to face the direction it is moving towards
  // Dog turns around when it hits a wall
  rotateObject(object, angle) {
    object.model.rotation = [
      Math.cos(angle), 0, Math.sin(angle), 0,
      0, 1, 0, 0,
      -Math.sin(angle), 0, Math.cos(angle), 0,
      0, 0, 0, 1,
    ];

    this.syncModelMatrix(object);
  }

  // ---- PLAYER COLLISION HELPERS -------
  playerCollision(otherObject) {
    if (otherObject.name.startsWith("dog")) {
      vec3.copy(this.robber.model.position, this.robber.spawn);
      mat4.copy(this.robber.model.rotation, this.robber.forward);
      this.syncModelMatrix(this.robber);

      vec3.copy(this.topDownView.position, this.topDownView.cameraSpawn);
      vec3.copy(this.topDownView.front, this.topDownView.cameraForward);

      mat4.copy(this.robberTestCollider.modelMatrix, this.robber.modelMatrix);
      vec3.copy(this.robberTestCollider.centroid, this.robber.centroid);
      vec3.copy(this.robberTestCollider.model.position, this.robber.spawn);
      vec3.copy(this.robberTestCollider.model.rotation, this.robber.forward);
      this.syncModelMatrix(this.robberTestCollider);
    }
  }

  despawnObject(obj) {
    // Remove from render list
    const i = this.state.objects.indexOf(obj);
    if (i !== -1) this.state.objects.splice(i, 1);

    // Remove from collision list
    const j = this.collidableSpheres.indexOf(obj);
    if (j !== -1) this.collidableSpheres.splice(j, 1);
  }

  playSound(soundId)
  {
    let soundEffect = document.getElementById(soundId);
    soundEffect.play();
  }



  // ---------- DOG MOVEMENT ----------
  setupDogPatrol(dog, axis, speed) {
    const idx = axis === "x" ? 0 : 2;
    let rotation = axis === "x" ? ((3 * Math.PI) / 2) : 0;
    dog.patrol = { axis, index: idx, speed, direction: 1, rotation };
    this.dogs.push(dog);
  }

  updateDogPatrol(dog, deltaTime) {
    if (!dog.patrol) return;

    // Clamp delta time to prevent huge jumps in movement 
    deltaTime = Math.min(deltaTime, 0.03);
    const p = dog.patrol;
    const idx = p.index;
    let step = p.speed * deltaTime * p.direction;

    // Use a test collider to see if the movement would cause a collision between the dog and the wall
    let testPos = vec3.clone(dog.model.position);
    testPos[idx] += step;

    let testDog = {
      name: "testDog",
      model: { position: testPos, scale: dog.model.scale },
      centroid: dog.centroid
    };

    this.createSphereCollider(testDog, 1);
    this.updateSphereCentre(testDog);


    let collision = this.boxSphereCollision(testDog);

    // Dog will hit a wall if it moves in the same direction, turn around 
    if (collision) {
      this.rotateObject(dog, (dog.patrol.rotation + Math.PI) % (2 * Math.PI));
      dog.patrol.rotation = (dog.patrol.rotation + Math.PI) % (2 * Math.PI);
      p.direction *= -1;
    }

    // Dog keeps moving in the same direction
    if (!collision) {
      let delta = vec3.fromValues(0, 0, 0);
      delta[idx] = step;
      dog.translate(delta);

      this.syncModelMatrix(dog);
    }

    this.updateSphereCentre(dog);
  }


  // ---------- CAMERA ----------
  updateCamera() {
    if (this.cameraMode === "topdown") return;


    // Anchor the camera to the player model's actual position.
    // Using centroid prevents "floating above the model" if the model origin is not at the feet.
    let base = vec3.clone(this.robber.model.position);

    if (this.robber.centroid) {
      vec3.add(base, base, this.robber.centroid);
    }

    // Apply eye height (Y only) and any extra offset
    base[1] += this.fpEyeHeight;
    if (this.fpExtraOffset) vec3.add(base, base, this.fpExtraOffset);

    // Face forward (flipped)
    let forward = this.getForwardVector(this.robber);
    vec3.scale(forward, forward, -1);

    // Keep your slight forward push
    let slight = vec3.create();
    vec3.scale(slight, forward, 0.1);
    vec3.add(base, base, slight);

    vec3.copy(this.topDownView.position, base);
    vec3.copy(this.topDownView.front, forward);
  }

  // ---------- STARTUP ----------
  async onStart() {
    this.startTime = new Date();
    console.log("On start");
    console.log("this state", this.state);

    

    // Prevent context menu on right-click
    document.addEventListener("contextmenu", (e) => e.preventDefault(), false);

    this.state.objects.forEach((object) => {
      // Initialize colliders  
      if (object.name.includes("Wall") || (object.name.includes("case"))) {
        this.createBoxCollider(object, object.model.scale[0], object.model.scale[2]);
        this.walls.push(object);
      }
 
      else if (object.name.includes("dog"))
        {
          this.createSphereCollider(object, 1.5);

          // A float between 0 and 1 will be added to the dog's base speed of 0.7
          var speed = Math.random(); 
        
          // Dogs that are rotated 0 degrees in the y direction move along the x axis 
          if (JSON.stringify(object.model.rotation) 
            == JSON.stringify([0,0,-1,0,0,1,0,0,1,0,0,0,0,0,0,1] )) // dog moves along z axis 
            {this.setupDogPatrol(object, "x", (0.7 + speed));}

          // Dogs that are rotated 90 degrees in the y direction move along the z axis 
          else if (JSON.stringify(object.model.rotation) == 
            JSON.stringify([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]))
            {this.setupDogPatrol(object, "z", (0.7 + speed));}
        
        }
    else if (object.name.includes("trophy"))
      {this.createSphereCollider(object, 30);}

    else if (object.name.includes("purse"))
      {this.createSphereCollider(object, 1);}

    else if (object.name.includes("diamond"))
      {this.createSphereCollider(object, 0.9);}

  });

    // Initialize Robber and Robber Test Colliders
    // The robber collider is used for detecting collsions with dogs
    // The robber test collider is used for detecting wall collisions
    this.robber = getObject(this.state, "robber");

    let fixRotation = mat4.create();
    mat4.fromYRotation(fixRotation, Math.PI * 340 / 180);
    mat4.mul(this.robber.model.rotation, fixRotation, this.robber.model.rotation);
    this.syncModelMatrix(this.robber);

    this.robber.spawn = vec3.clone(this.robber.model.position);
    this.robber.forward = mat4.clone(this.robber.model.rotation);

    this.robberTestCollider = new RenderObject(this.state.gl, {
      name: "robberTestCollider",
      model: { position: vec3.create(), rotation: mat4.create(), scale: vec3.create() },
      modelMatrix: mat4.create()
    });

    this.robberTestCollider.model.position = vec3.clone(this.robber.model.position);
    this.robberTestCollider.model.rotation = mat4.clone(this.robber.model.rotation);
    this.robberTestCollider.model.scale = vec3.clone(this.robber.model.scale);

    this.robberTestCollider.modelMatrix = mat4.clone(this.robber.modelMatrix);
    this.robberTestCollider.centroid = vec3.clone(this.robber.centroid);

    this.createSphereCollider(this.robber, 1.2);
    this.createSphereCollider(this.robberTestCollider, 1.2);
 
    this.updateSphereCentre(this.robber);
    this.updateSphereCentre(this.robberTestCollider);


    // Topdown view will be the initial POV
    this.setRobberVisible(true);

    this.topDownView = this.state.camera;

    this.topDownView.cameraSpawn = vec3.clone(this.state.camera.position);
    this.topDownView.cameraForward = vec3.clone(this.state.camera.front);

    this.cameraMode = "topdown";

    this.topDownOffset = vec3.create();
    vec3.subtract(this.topDownOffset, this.topDownView.position, this.robber.model.position);


    // ---------- CONTROLS ----------
    document.addEventListener("keydown", (event) => {
      event.preventDefault();

      // POV toggle
      if (event.code === "KeyV") {
        const goingFirst = (this.cameraMode === "topdown");
        this.cameraMode = goingFirst ? "firstperson" : "topdown";

        this.setRobberVisible(this.cameraMode === "topdown");

        if (!goingFirst) {
          let restored = vec3.create();
          vec3.add(restored, this.robber.model.position, this.topDownOffset);
          vec3.copy(this.topDownView.position, restored);
          vec3.copy(this.topDownView.front, this.topDownView.cameraForward);
        } else {
          //Snap FP immediately this frame
          this.updateCamera();
        }
        return;
      }

      switch (event.code) {
        case "KeyA": this.robberTestCollider.translate(vec3.fromValues(-0.1, 0, 0)); break;
        case "KeyD": this.robberTestCollider.translate(vec3.fromValues(0.1, 0, 0)); break;
        case "KeyS": this.robberTestCollider.translate(vec3.fromValues(0, 0, 0.1)); break;
        case "KeyW": this.robberTestCollider.translate(vec3.fromValues(0, 0, -0.1)); break;
      }

      this.syncModelMatrix(this.robberTestCollider);

      let blocked = this.boxSphereCollision(this.robberTestCollider);

      if (blocked) {
        this.syncModelMatrix(this.robber);

        mat4.copy(this.robberTestCollider.modelMatrix, this.robber.modelMatrix);
        vec3.copy(this.robberTestCollider.centroid, this.robber.centroid);
        vec3.copy(this.robberTestCollider.model.position, this.robber.model.position);
        vec3.copy(this.robberTestCollider.model.rotation, this.robber.model.rotation);

        this.syncModelMatrix(this.robberTestCollider);
      }
      else {
        // ---------- FIRST PERSON MOVEMENT (camera-based) ----------
        switch (event.code) {
          case "KeyW":
            if (this.cameraMode === "firstperson") {
              let forward = vec3.clone(this.topDownView.front);
              forward[1] = 0;
              vec3.normalize(forward, forward);
              vec3.scale(forward, forward, 0.1);
              this.attemptMove(this.robber, forward);
              break;
            }
            this.robber.translate(vec3.fromValues(0, 0, -0.1));
            this.rotateObject(this.robber, Math.PI);
            vec3.add(this.topDownView.position, this.topDownView.position, vec3.fromValues(0, 0, -0.1));
            break;

          case "KeyS":
            if (this.cameraMode === "firstperson") {
              let forward = vec3.clone(this.topDownView.front);
              forward[1] = 0;
              vec3.normalize(forward, forward);
              vec3.scale(forward, forward, -0.1);
              this.attemptMove(this.robber, forward);
              break;
            }
            this.robber.translate(vec3.fromValues(0, 0, 0.1));
            this.rotateObject(this.robber, 0);
            vec3.add(this.topDownView.position, this.topDownView.position, vec3.fromValues(0, 0, 0.1));
            break;

          case "KeyA":
            if (this.cameraMode === "firstperson") {
              let left = vec3.create();
              vec3.cross(left, this.topDownView.front, vec3.fromValues(0, 1, 0));
              left[1] = 0;
              vec3.normalize(left, left);
              vec3.scale(left, left, -0.1);
              this.attemptMove(this.robber, left);
              break;
            }
            this.robber.translate(vec3.fromValues(-0.1, 0, 0));
            this.rotateObject(this.robber, Math.PI / 2);
            vec3.add(this.topDownView.position, this.topDownView.position, vec3.fromValues(-0.1, 0, 0));
            break;

          case "KeyD":
            if (this.cameraMode === "firstperson") {
              let right = vec3.create();
              vec3.cross(right, this.topDownView.front, vec3.fromValues(0, 1, 0));
              right[1] = 0;
              vec3.normalize(right, right);
              vec3.scale(right, right, 0.1);
              this.attemptMove(this.robber, right);
              break;
            }
            this.robber.translate(vec3.fromValues(0.1, 0, 0));
            this.rotateObject(this.robber, 3 * (Math.PI / 2));
            vec3.add(this.topDownView.position, this.topDownView.position, vec3.fromValues(0.1, 0, 0));
            break;
        }

        this.syncModelMatrix(this.robber);

        this.updateSphereCentre(this.robber);
        this.updateSphereCentre(this.robberTestCollider);
      }
    });
  }

  // ---------- UPDATE LOOP ----------
  onUpdate(deltaTime) {

    // Check robber to dog collsions 
    // Check robber to collectable object collisions 
    if (this.robber) {
      this.sphereCollision(this.robber);
    }

    // Move each dog along its patrol path
    this.dogs.forEach((dog) => {
      this.updateDogPatrol(dog, deltaTime);
    });


    // Game over
    if (this.collected == 5 && this.gameComplete == false){
      this.gameComplete = true;
      document.getElementById("gameOver").style.display = "flex";
      console.log("done");

      // Display the final score and restart button 
      let baseScore = 10000;
      let endTime = new Date();
      let totalTime = endTime - this.startTime; //ms 
      totalTime /= 1000;

      // Score is calculated by subtracting the time taken to complete the game 
      // and the number of times the player was hit, from the base score 10000
      // Lowest score possible is 0 
      let finalScore = Math.max(0, baseScore - Math.floor(totalTime * 10)
         - (this.timesHit *10));
      document.getElementById("finalScore").textContent =" Score:" + finalScore;
    }

    this.updateCamera();
  }
}

function restartGame(){
  location.reload();
  }