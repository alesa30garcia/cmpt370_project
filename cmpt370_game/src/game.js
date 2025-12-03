class Game {
  constructor(state) {
    this.state = state;
    this.spawnedObjects = [];
    this.collidableObjects = [];
    this.walls = [];
  }

  // Example custom method
  customMethod() {
    console.log("Custom method!");
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
    let centre = vec3.create();
    vec3.add(centre, object.model.position, object.centroid);
    object.collider.centre = centre;
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
    object.collider.minX =
      object.model.position[0] - object.collider.width / 2;
    object.collider.maxX =
      object.model.position[0] + object.collider.width / 2;
    object.collider.minZ =
      object.model.position[2] - object.collider.depth / 2;
    object.collider.maxZ =
      object.model.position[2] + object.collider.depth / 2;

    // Debug if you like:
    // console.log(
    //   object.name,
    //   object.collider.minX,
    //   object.collider.maxX,
    //   object.collider.minZ,
    //   object.collider.maxZ
    // );
  }

  // object = sphere (robberTestCollider or robber), walls = axis-aligned boxes
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
        if (wall.collider.onCollide) {
          wall.collider.onCollide(object);
        }
        // console.log("Hit wall:", wall.name);
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
    // Currently only left/right; you can add more names here as needed.
    this.state.objects.forEach((object) => {
      if (
        object.name === "leftWall" ||
        object.name === "rightWall"
      ) {
        this.createBoxCollider(
          object,
          object.model.scale[0],
          object.model.scale[2]
        );
        this.walls.push(object);
        // console.log(
        //   object.name,
        //   "pos",
        //   object.model.position,
        //   "scale",
        //   object.model.scale
        // );
      }
    });

    console.log("walls", this.walls);

    // Robber and test collider
    this.robber = getObject(this.state, "robber");

    this.robberTestCollider = new RenderObject(this.state.gl, {
      name: "robberTestCollider",
      model: {
        position: vec3.clone(this.robber.model.position),
        rotation: mat4.clone(this.robber.model.rotation),
        scale: vec3.clone(this.robber.model.scale),
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

    this.robber.spawn = vec3.clone(this.robber.model.position);
    this.robber.forward = mat4.clone(this.robber.model.rotation);

    // Dogs
    this.dog1 = getObject(this.state, "dog");
    this.dog2 = getObject(this.state, "dog-copy");
    this.dog3 = getObject(this.state, "dog-copy-copy");
    this.dog4 = getObject(this.state, "dog-copy-copy-copy");
    this.dog5 = getObject(
      this.state,
      "dog-copy-copy-copy-copy"
    );

    // Colliders
    this.createSphereCollider(this.robber, 2);
    this.createSphereCollider(this.robberTestCollider, 2);
    this.updateSphereCentre(this.robber);
    this.updateSphereCentre(this.robberTestCollider);

    this.createSphereCollider(this.dog1, 1);
    this.createSphereCollider(this.dog2, 1);
    this.createSphereCollider(this.dog3, 1);
    this.createSphereCollider(this.dog4, 1);
    this.createSphereCollider(this.dog5, 1);

    // Keyboard movement using test collider first (for wall checks)
    document.addEventListener("keydown", (event) => {
      event.preventDefault();

      // Move test collider
      switch (event.code) {
        case "KeyA":
          this.robberTestCollider.translate(
            vec3.fromValues(-0.1, 0, 0)
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
            vec3.fromValues(0, 0, -0.1)
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
              vec3.fromValues(-0.1, 0, 0)
            );
            this.rotatePlayer(this.robber, Math.PI / 2);
            break;

          case "KeyD":
            this.robber.translate(
              vec3.fromValues(0.1, 0, 0)
            );
            this.rotatePlayer(
              this.robber,
              3 * (Math.PI / 2)
            );
            break;

          case "KeyS":
            this.robber.translate(
              vec3.fromValues(0, 0, 0.1)
            );
            this.rotatePlayer(this.robber, 0);
            break;

          case "KeyW":
            this.robber.translate(
              vec3.fromValues(0, 0, -0.1)
            );
            this.rotatePlayer(this.robber, Math.PI);
            break;

          default:
            break;
        }

        this.updateSphereCentre(this.robber);
        this.updateSphereCentre(this.robberTestCollider);
      }

      // Debug: current robber position
      // console.log("Robber position:", this.robber.model.position);
    });
  }

  // ---------- PER-FRAME UPDATE ----------

  onUpdate(deltaTime) {
    // Check robber vs dogs
    if (this.robber) {
      this.sphereCollision(this.robber);
    }

    // We DO NOT call boxSphereCollision(this.robber) here,
    // walls are already handled via the test collider in keydown.
  }
}
