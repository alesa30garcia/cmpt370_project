class Game {
  constructor(state) {
    this.state = state;
    this.spawnedObjects = [];
    this.collidableObjects = [];
    this.walls = [];
    this.dogs = [];          // convenient array of all dogs
    
  }

  // ---------- SPHERE COLLIDERS (robber, dogs, test collider) ----------

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

    // Don't add the test collider to the main collidable list
    if (object !== this.robberTestCollider) {
      this.collidableObjects.push(object);
    }
  }

  updateSphereCentre(object) {
    var centre = vec3.create();
    if (object.name == "robberTestCollider")
    {
    //let centre = vec3.create();
    let offset = vec3.fromValues(-0.25,0,-0.25); // -0.3 x

   
    vec3.add(offset, object.centroid, offset);
    
    vec3.add(centre, object.model.position, offset);
    console.log(centre);
    object.collider.centre = centre;}
    
    else
    {
    //let centre = vec3.create();
    vec3.add(centre, object.model.position, object.centroid);
    object.collider.centre = centre;
    }
  }

  // Check robber vs all other sphere colliders (dogs etc.)
  sphereCollision(object) {
    this.updateSphereCentre(object);

    this.collidableObjects.forEach((otherObject) => {
      if (otherObject.name === object.name) return;

      this.updateSphereCentre(otherObject);
      let distance = vec3.distance(
        object.collider.centre,
        otherObject.collider.centre
      );
      let radiusSum = object.collider.radius + otherObject.collider.radius;

      if (distance < radiusSum) {
        // Collision!
        if (
          object.name === "robber" &&
          otherObject.name.startsWith("dog")
        ) {
          // Robber got caught by a dog
          this.playerCollision(otherObject);
        } else {
          object.collider.onCollide(otherObject);
        }
      }
    });
  }

  // ---------- BOX COLLIDERS (walls) ----------

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
    this.collidableObjects.push(object);
  }

  updateBoxCollider(object) {
      if (object.model.scale[0] == 0.5)
      {
        var tempX = object.collider.maxX + object.collider.width/2;
        var tempZ = object.collider.maxZ + object.collider.depth/4;
      }

      else if (object.model.scale[2] == 0.5)
        {
        var tempX = object.collider.maxX + object.collider.width/4;
        var tempZ = object.collider.maxZ + object.collider.depth/2;
      }

      object.collider.minX =
         object.model.position[0] - tempX;

      object.collider.maxX =
        object.model.position[0] + tempX;

      object.collider.minZ =
        object.model.position[2] - tempZ;

      object.collider.maxZ =
        object.model.position[2] + tempZ;
   
    //console.log(object.name, "pos", object.model.position,"scale,",object.model.scale, "width",object.collider.width, "depth",object.collider.depth)
    //console.log(object.collider.minX, object.collider.maxX, object.collider.minZ, object.collider.maxZ);
    
  }

  // object = sphere (robberTestCollider, robber or dogs), walls = axis-aligned boxes
  boxSphereCollision(object) {
    this.updateSphereCentre(object);
    let collision = false;

    this.walls.forEach((wall) => {
      // Clamp sphere centre to wall AABB
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

      if (distance < object.collider.radius) {
        // We hit this wall
        collision = true;
        // Optional: wall collider callback
        // if (wall.collider.onCollide) {
        //   wall.collider.onCollide(object);
         
        // }
      }
    });

    return collision;
  }

  // ---------- PLAYER FACING / COLLISION HANDLING ----------

  rotatePlayer(object, angle) {
    // Update rotation matrix so player faces movement direction
    object.model.rotation = [
      Math.cos(angle), 0, Math.sin(angle), 0,
      0, 1, 0, 0,
      -Math.sin(angle), 0, Math.cos(angle), 0,
      0, 0, 0, 1,
    ];
  }

  playerCollision(otherObject) {
    // Only special case: robber hit by dog → reset to spawn
    if (otherObject.name.startsWith("dog")) {
      vec3.copy(this.robber.model.position, this.robber.spawn);
      mat4.copy(this.robber.model.rotation, this.robber.forward);
      vec3.copy(this.topDownView.position, this.topDownView.cameraSpawn);
      vec3.copy(this.topDownView.front, this.topDownView.cameraForward);

      // Keep test collider in sync with robber
      mat4.copy(
        this.robberTestCollider.modelMatrix,
        this.robber.modelMatrix
      );
      vec3.copy(
        this.robberTestCollider.centroid,
        this.robber.centroid
      );
      vec3.copy(
        this.robberTestCollider.model.position,
        this.robber.spawn
      );
      vec3.copy(
        this.robberTestCollider.model.rotation,
        this.robber.forward
      );
    }
  }


  
  // ---------- DOG PATROL HELPERS ----------

  /**
   * Set up a simple back-and-forth patrol for a dog.
   * axis: 'x' or 'z'
   * speed: units per frame update
   */
  setupDogPatrol(dog, axis, speed)
  {
    const idx = axis === "x" ? 0 : 2;
    let rotation = axis === "x" ? ((3 * Math.PI)/2) : 0;
    dog.patrol = {
      axis,
      index: idx,
      speed: speed,
      direction: 1, // +1 or -1
      rotation: rotation
    };

    this.dogs.push(dog);
    
  }

  /**
   * Use wall collsions to determine whether the dog should keep moving in the current direction or 
   * change directions.
   * dog: dog object to check 
   * deltaTime: time since the last frame update
   */
updateDogPatrol(dog, deltaTime) {
    if (!dog.patrol) return;

    // clamp the update time so the movement does not become huge
    // while the tab is not being looked at
    deltaTime = Math.min(deltaTime, 0.03); 
    const p = dog.patrol;
    const idx = p.index;

    // distance to move this frame
    let step = p.speed * deltaTime * p.direction;

    // translate to new position along patrol axis
    // create a test collider to see if moving in the current direction will cause a wall collision
    let testPos = vec3.clone(dog.model.position);
    testPos[idx] += step;
    let testDog = 
    {
      name: "testDog", model:
      {
      position: testPos, 
      scale:dog.model.scale, 
      }, 
      centroid: dog.centroid, 

    };
   
    this.createSphereCollider(testDog, 1);
    this.updateSphereCentre(testDog);
    
    // test for wall collision
    let collision = this.boxSphereCollision(testDog);
    
    // change direction when the test collider hits the wall
    if (collision) {
       this.rotatePlayer(dog, (dog.patrol.rotation + Math.PI) % (2 * Math.PI));
       dog.patrol.rotation = (dog.patrol.rotation + Math.PI) % (2 * Math.PI);
    
       p.direction *= -1; 
    }

    // move the actual dog when there is no wall collision
    if (!collision)
      {
      let delta = vec3.fromValues(0, 0, 0);
      delta[idx] = step;
      dog.translate(delta);
    }
  
    // keep collider in sync
    this.updateSphereCentre(dog);
  }



  // ---------- STARTUP ----------

  async onStart() {
    console.log("On start");
    console.log("this state", this.state);

    // prevent context menu on right-click
    document.addEventListener(
      "contextmenu",
      (e) => {
        e.preventDefault();
      },
      false
    );

    // Create box colliders for walls.
    this.state.objects.forEach((object) => {

      if (object.name.includes("Wall"))
       {
       
        this.createBoxCollider(
          object,
          object.model.scale[0],
          object.model.scale[2]);
      
          this.walls.push(object);

        }
      else if (object.name.includes("dog"))
        {
          this.createSphereCollider(
          object,
          1);
        

          // dogs that are rotated 0 degrees in the y direction move along the x axis 
          if (JSON.stringify(object.model.rotation) == JSON.stringify([0,0,-1,0,0,1,0,0,1,0,0,0,0,0,0,1] )) // dog moves along z axis 
            {this.setupDogPatrol(object, "x", 1.0);}

          // dogs that are rotated 90 degrees in the y direction move along the z axis 
          else if (JSON.stringify(object.model.rotation) == JSON.stringify([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]))
            {this.setupDogPatrol(object, "z", 1.0);}
          //make an array for speeds so they can be different 
      }
    else if (object.name.includes("trophy"))
      {
        this.createSphereCollider(object, 1);
      }

    else if (object.name.includes("purse"))
    {

    }

  });

    //console.log("walls", this.walls);
    //console.log("dogs", this.dogs);

    // Robber and test collider
    this.robber = getObject(this.state, "robber");
    this.robber.spawn = vec3.clone(this.robber.model.position);
    this.robber.forward = mat4.clone(this.robber.model.rotation);

    this.robberTestCollider = new RenderObject(this.state.gl, {
      name: "robberTestCollider",
      model: {
        position: vec3.create(),
        rotation: mat4.create(),
        scale: vec3.create(),
      },
      modelMatrix: mat4.create(),
    });

    this.robberTestCollider.model.position = vec3.clone(
      this.robber.model.position
    );
    this.robberTestCollider.model.rotation = mat4.clone(
      this.robber.model.rotation
    );
    this.robberTestCollider.model.scale = vec3.clone(
      this.robber.model.scale
    );

    this.robberTestCollider.modelMatrix = mat4.clone(
      this.robber.modelMatrix
    );
    this.robberTestCollider.centroid = vec3.clone(
      this.robber.centroid
    );

   
    // Robber and Robber Test Colliders
    // The robber collider is used for detecting collsions with dogs
    // The robber test collider is used for detecting wall collisions
    this.createSphereCollider(this.robber, 2);
    this.createSphereCollider(this.robberTestCollider, 1);
    this.updateSphereCentre(this.robber);
    this.updateSphereCentre(this.robberTestCollider);


    // Set up camera 
    this.topDownView = this.state.camera;
    
    this.topDownView.cameraSpawn = vec3.create();
    this.topDownView.cameraForward = vec3.create();

    vec3.copy(this.topDownView.cameraSpawn, this.state.camera.position);
    vec3.copy(this.topDownView.cameraForward , this.state.camera.front);
   
    // Keyboard movement using test collider first (for wall checks)
    document.addEventListener("keydown", (event) => {
      event.preventDefault();

      // Move test collider
      switch (event.code) {
        case "KeyA":
          this.robberTestCollider.translate(
            vec3.fromValues(- 0.1, 0, 0)
          );
          break;

        case "KeyD":
          this.robberTestCollider.translate(
            vec3.fromValues(0.1, 0, 0)
          );
          break;

        case "KeyS":
          this.robberTestCollider.translate(
            vec3.fromValues(0, 0, 0.1)
          );
          break;

        case "KeyW":
          this.robberTestCollider.translate(
            vec3.fromValues(0, 0, - 0.1)
          );
          break;

        default:
          break;
      }

      // Check if test collider hit a wall
      let collision = this.boxSphereCollision(
        this.robberTestCollider
      );

      if (collision) {
        // Reset test collider back to real robber
        // so robber doesn't move into the wall
        mat4.copy(
          this.robberTestCollider.modelMatrix,
          this.robber.modelMatrix
        );
        vec3.copy(
          this.robberTestCollider.centroid,
          this.robber.centroid
        );
        vec3.copy(
          this.robberTestCollider.model.position,
          this.robber.model.position
        );
        vec3.copy(
          this.robberTestCollider.model.rotation,
          this.robber.model.rotation
        );
      } else {
        // No wall collision → commit movement to real robber
        switch (event.code) {
          case "KeyA":
            this.robber.translate(
              vec3.fromValues(- 0.1, 0, 0)
            );
            this.rotatePlayer(this.robber, Math.PI / 2);
          
            vec3.add(this.topDownView.position, 
              this.topDownView.position,
              vec3.fromValues(- 0.1, 0, 0)
            );

            break;

          case "KeyD":
            this.robber.translate(
              vec3.fromValues(0.1, 0, 0)
            );
            this.rotatePlayer(this.robber, 3 * (Math.PI / 2));
           
            vec3.add(this.topDownView.position, 
              this.topDownView.position,
              vec3.fromValues(0.1, 0, 0)
            );

            break;

          case "KeyS":
            this.robber.translate(
              vec3.fromValues(0, 0, 0.1)
            );
            this.rotatePlayer(this.robber, 0);
            vec3.add(this.topDownView.position, 
              this.topDownView.position,
              vec3.fromValues(0, 0, 0.1)
            );

            break;

          case "KeyW":
            this.robber.translate(
              vec3.fromValues(0, 0, - 0.1)
            );
            this.rotatePlayer(this.robber, Math.PI);
            vec3.add(this.topDownView.position, 
              this.topDownView.position,
              vec3.fromValues(0, 0, - 0.1)
            );

            break;

          default:
            break;
        }
        //console.log(this.robber.model.position);
        this.updateSphereCentre(this.robber);
        this.updateSphereCentre(this.robberTestCollider);
      }
    });
  }

  // ---------- PER-FRAME UPDATE ----------

  onUpdate(deltaTime) {
    // Check robber vs dogs
    if (this.robber) {
      this.sphereCollision(this.robber);
    }

    // Move each dog along its patrol path
    this.dogs.forEach((dog) => {
      this.updateDogPatrol(dog, deltaTime);
    });
   

    // We DO NOT call boxSphereCollision(this.robber) here,
    // walls are already handled via the test collider in keydown.
  }
}
