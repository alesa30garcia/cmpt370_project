class Game {
  constructor(state) {
    this.state = state;
    this.spawnedObjects = [];
    this.collidableObjects = [];
    this.walls = [];
  }

//   // example - we can add our own custom method to our game and call it using 'this.customMethod()'
   customMethod() {
     console.log("Custom method!");
}


   // example - create a collider on our object with various fields we might need (you will likely need to add/remove/edit how this works)
  createSphereCollider(object, radius, onCollide = null) {
    object.collider = {
      type: "SPHERE",
      radius: radius * object.model.scale[0],
      centre:vec3.create(),
      onCollide: onCollide ? onCollide : (otherObject) => {
        console.log(`Collided with ${otherObject.name}`
        
        );
      }
    };
    if (object != this.robberTestCollider)
      {this.collidableObjects.push(object);}
}

updateSphereCentre(object){
  let centre = vec3.create();
    //console.log(object);
    vec3.add(centre, object.model.position, object.centroid);
    //vec3.transformMat4(centre, object.centroid, object.modelMatrix);

    object.collider.centre = centre;
}

sphereCollision(object) {
    this.updateSphereCentre(object);
// loop over all the other collidable objects 
    this.collidableObjects.forEach(otherObject => {
      if (otherObject.name !== object.name)
        {
  
        this.updateSphereCentre(otherObject);
        let distance = vec3.distance(object.collider.centre, otherObject.collider.centre);
        if (distance < (object.collider.radius + otherObject.collider.radius))

            if (object.name == "robber" && otherObject.name.startsWith("dog"))
              {this.playerCollision(otherObject);}
        else
              {object.collider.onCollide(otherObject);}
     }});
}


createBoxCollider(object, width, depth, onCollide = null){
    {
      object.collider = 
          {
          type: "BOX",
          width: width,
          depth:depth,
          minX: 0,
          maxX: 0,
          minZ: 0,
          maxZ: 0,
          onCollide: onCollide ? onCollide : (otherObject) => {
          console.log(`Collided with ${otherObject.name}`);}
          }
    }
    this.updateBoxCollider(object);
    this.collidableObjects.push(object);
}

updateBoxCollider(object, onCollide = null) 
{
  
    object.collider.minX = object.model.position[0] - object.collider.width/2;
    object.collider.maxX = object.model.position[0] + object.collider.width/2;
    object.collider.minZ = object.model.position[2] - object.collider.depth/2;
    object.collider.maxZ = object.model.position[2] + object.collider.depth/2;   
    console.log(object.name,object.collider.minX, object.collider.maxX, object.collider.minZ,object.collider.maxZ); 
}


// object is a sphere
// other object is a wall
boxSphereCollision(object, onCollide = null) {
    this.updateSphereCentre(object);
    let collision = false;
    this.walls.forEach(wall => {
    //let objectPosition = vec3.create();
    //vec3.transformMat4(objectPosition, vec3.fromValues(0,0,0), object.modelMatrix);
    //console.log(object.collider.centre);
    const x = Math.max(wall.collider.minX, Math.min(object.collider.centre[0], wall.collider.maxX));
    
    const z = Math.max(wall.collider.minZ, Math.min(object.collider.centre[2], wall.collider.maxZ));

  // this is the same as isPointInsideSphere
    const distance = Math.sqrt(
      (x - object.collider.centre[0]) * (x - object.collider.centre[0]) +
      (z - object.collider.centre[2]) * (z - object.collider.centre[2]));
      //console.log(distance);
   if (distance < object.collider.radius)
    {
      this.playerCollision(wall);
      collision = true;
      console.log(wall.name);
   }
  
  });
  return collision;
}
    // regular box to box collision -----------------------------
     //if (object.name !== otherObject.name &&
    //object.collider.minX <= otherObject.collider.maxX &&
    // object.collider.maxX >= otherObject.collider.minX &&
     //object.collider.minZ <= otherObject.collider.maxZ &&
    // object.collider.maxZ >= otherObject.collider.minZ)
    // {if (object.name === "robber")
    //   {object.collider.playerCollision(otherObject);} ---------


    // let currentPosition1 = vec3.create();
    // vec3.transformMat4(currentPosition1, vec3.fromValues(0,0,0), object.modelMatrix)
    // let currentPosition2 = vec3.create();
    // vec3.transformMat4(currentPosition2, vec3.fromValues(0,0,0), otherObject.modelMatrix);
    //console.log("postion of ", object.name, currentPosition1, "position of", otherObject.name, currentPosition2);
    //console.log("collider of:", object.name,  object.collider.minX, object.collider.maxX, object.collider.minZ,object.collider.maxZ);
    //console.log("collider of", otherObject.name, otherObject.collider.minX, otherObject.collider.maxX, otherObject.collider.minZ, otherObject.collider.maxZ);

 


        // let position1 = vec3.create();
        // vec3.transformMat4(position1, vec3.fromValues(0,0,0), object.modelMatrix);

        // let position2 = vec3.create();
        // vec3.transformMat4(position2, vec3.fromValues(0,0,0), otherObject.modelMatrix);

        // let distance = vec3.distance(position1, position2);

        // if (otherObject.name !== object.name && (distance < (object.collider.radius + otherObject.collider.radius)))
        //   {
        //   object.collider.onCollide(otherObject);
      
          
        //   }})}

//       // do a check to see if we have collided, if we have we can call object.onCollide(otherObject) which will
//       // call the onCollide we define for that specific object. This way we can handle collisions identically for all
//       // objects that can collide but they can do different things (ie. player colliding vs projectile colliding)
//       // use the modeling transformation for object and otherObject to transform position into current location
//       // ie: 
//       // if (collide){ object.collider.onCollide(otherObject) } // fires what we defined our object should do when it collides
//     });

rotatePlayer(object, angle){
    // update rotate matrix so that player faces the direction it is moving towards
    object.model.rotation = [Math.cos(angle), 0, Math.sin(angle), 0, 
                              0, 1 , 0, 0,
                              -Math.sin(angle), 0, Math.cos(angle), 0, 
                              0, 0, 0 ,1];
      
}


playerCollision(otherObject){
  //console.log("robber collision");
  //vec3.copy(this.robber.model.position, this.robber.spawn);
  if (otherObject.name.startsWith("dog"))
      {vec3.copy(this.robber.model.position, this.robber.spawn);
      mat4.copy(this.robber.model.rotation, this.robber.forward);
      mat4.copy(this.robberTestCollider.modelMatrix, this.robber.modelMatrix);
      vec3.copy(this.robberTestCollider.centroid, this.robber.centroid);
      vec3.copy(this.robberTestCollider.model.position, this.robber.spawn);
      vec3.copy(this.robberTestCollider.model.rotation, this.robber.forward);

    }
  // else if (otherObject.name.includes("Wall"))
  //   {let w =2;}
  //     //console.log("hit a wall");}
     
}

// wallColliion()
// {
//    this.state.objects.forEach(object => {
//        if (object.type === "cube" && object.model.scale[0] === 0.5)
//          {this.createBoxCollider(object, object.model.scale[0], object.model.scale[2]);} // object,width, depth
//      });
// }


//   // runs once on startup after the scene loads the objects
async onStart() {
    console.log("On start");
    console.log("this state", this.state);


    // this just prevents the context menu from popping up when you right click
    document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    }, false);


// creating box colliders for all walls 
  // "mazeWall1-copy-copy-copy" is the only rotated wall- horizontal walls scaled in x, vertical walls scaled in z
  // thickness scaled to 0.5 always  so horizontal walls have z = 0.5

  //                                     vertical walls have x = 0.5

    this.state.objects.forEach(object => {
       //if (object.type === "cube" && object.model.scale[0] === 0.5)

          // vertical walls
          if (object.name === "leftWall" || object.name === "rightWall")
          {this.createBoxCollider(object, object.model.scale[0], object.model.scale[2]);
          this.walls.push(object);
          console.log(object.name, object.model.position, object.model.scale, object.collider.minX, object.collider.maxX, object.collider.minZ, object.collider.maxZ);
         } // object,width, depth
        //  else if (object.type === "cube" && object.model.scale[2] === 0.5)
        // else if (object.name === "frontWall" || object.name === "backWall")
        //  {
        //   this.createBoxCollider(object, object.model.scale[0], object.model.scale[2]);
        //   this.walls.push(object);
        //   console.log(object.name, "pos", object.model.position, "scale", object.model.scale, object.collider.minX, object.collider.maxX, object.collider.minZ, object.collider.maxZ);
        //  } // object,width, depth
        

     });
  

    console.log("walls", this.walls);
    // creating sphere colliders for non-wall objects
    this.robber = getObject(this.state, "robber");
    console.log(this.robber);
  
     
    //console.log(this.robberTestCollision);
    this.robberTestCollider = new RenderObject(this.state.gl,
    {
    name: "robberTestCollider",
    model: {
        position: vec3.clone(this.robber.model.position),
        rotation: mat4.clone(this.robber.model.rotation),
        scale: vec3.clone(this.robber.model.scale),      
    },
    modelMatrix: mat4.create(),
});


this.robberTestCollider.model.position = vec3.clone(this.robber.model.position);
this.robberTestCollider.model.rotation = vec3.clone(this.robber.model.rotation);
this.robberTestCollider.model.scale = vec3.clone(this.robber.model.scale);

this.robberTestCollider.modelMatrix = mat4.clone(this.robber.modelMatrix);
this.robberTestCollider.centroid = vec3.clone(this.robber.centroid);

  console.log(this.robber);
  console.log(this.robberTestCollider);
  console.log(this.robber);
  console.log("centroid", this.robber.centroid);
 
    this.robber.spawn = vec3.clone(this.robber.model.position);
    this.robber.forward = mat4.clone(this.robber.model.rotation);

    this.dog1 = getObject (this.state, "dog");
    this.dog2 = getObject (this.state, "dog-copy");
    this.dog3 = getObject (this.state, "dog-copy-copy");
    this.dog4 = getObject (this.state, "dog-copy-copy-copy");
    this.dog5 = getObject (this.state, "dog-copy-copy-copy-copy");

    this.createSphereCollider(this.robber, 2);
    this.createSphereCollider(this.robberTestCollider, 2);
    this.updateSphereCentre(this.robber);
    this.updateSphereCentre(this.robberTestCollider);
    console.log(this.robberTestCollider.collider);
    console.log(this.robber.collider);

    this.createSphereCollider(this.dog1, 1);
    this.createSphereCollider(this.dog2, 1)
    this.createSphereCollider(this.dog3, 1)
    this.createSphereCollider(this.dog4, 1)
    this.createSphereCollider(this.dog5, 1)
    //console.log(this.collidableObjects);
  // creating box colliders for walls

    document.addEventListener("keydown", (event) => {
        event.preventDefault()
       
        
        switch(event.code)
        {
          case "KeyA":
            this.robberTestCollider.translate(vec3.fromValues(-0.1, 0,0));
            //this.rotatePlayer(this.robber, Math.PI/2);
            break;
          
          case "KeyD":
            this.robberTestCollider.translate(vec3.fromValues(0.1, 0,0));
            //this.rotatePlayer(this.robber, 3 * (Math.PI/2));
            break;

          case "KeyS":
             this.robberTestCollider.translate(vec3.fromValues(0, 0, 0.1));
             //this.rotatePlayer(this.robber, 0);
            break;

          case "KeyW":
             this.robberTestCollider.translate(vec3.fromValues(0, 0, -0.1));
             //this.rotatePlayer(this.robber, Math.PI);
            break;


        }

      
        let collision = this.boxSphereCollision(this.robberTestCollider);
      
      if (collision == true) // do not move the player, reset the robberTestCollider to match player 
    {
      console.log("hit wall");

      mat4.copy(this.robberTestCollider.modelMatrix, this.robber.modelMatrix);
      vec3.copy(this.robberTestCollider.centroid, this.robber.centroid);
      vec3.copy(this.robberTestCollider.model.position, this.robber.model.position);
      vec3.copy(this.robberTestCollider.model.rotation, this.robber.model.rotation);

  }
    else if (collision == false) // move the actual robber
    {
      
      switch(event.code){
       case "KeyA":
            this.robber.translate(vec3.fromValues(-0.1, 0,0));
            this.rotatePlayer(this.robber, Math.PI/2);
            break;
          
          case "KeyD":
            this.robber.translate(vec3.fromValues(0.1, 0,0));
            this.rotatePlayer(this.robber, 3 * (Math.PI/2));
            break;

          case "KeyS":
             this.robber.translate(vec3.fromValues(0, 0, 0.1));
             this.rotatePlayer(this.robber, 0);
            break;

          case "KeyW":
             this.robber.translate(vec3.fromValues(0, 0, -0.1));
             this.rotatePlayer(this.robber, Math.PI);
            break;

      }
    this.updateSphereCentre(this.robber);
    this.updateSphereCentre(this.robberTestCollider);

    }
    
  
  // console.log("robber centre", this.robber.collider.centre);
  // console.log("robber centroid", this.robber.centroid);
  // console.log("collider centre", this.robberTestCollider.collider.centre);
  // console.log("robber collider centroid", this.robberTestCollider.centroid)

  console.log(this.robber.model.position);
  }
);   
}

    
//     // example - set an object in onStart before starting our render loop!
//     this.cube = getObject(this.state, "cube1");
//     const otherCube = getObject(this.state, "cube2"); // we wont save this as instance var since we dont plan on using it in update
        
//     // example - create sphere colliders on our two objects as an example, we give 2 objects colliders otherwise
//     // no collision can happen
//     this.createSphereCollider(this.cube, 0.5, (otherObject) => {
//       console.log(`This is a custom collision of ${otherObject.name}`)
//     });
//     // this.createSphereCollider(otherCube, 0.5);

//     // example - setting up a key press event to move an object in the scene
//     document.addEventListener("keypress", (e) => {
//       e.preventDefault();

//       switch (e.key) {
//         case "a":
//           this.cube.translate(vec3.fromValues(0.5, 0, 0));
//           break;

//         case "d":
//           this.cube.translate(vec3.fromValues(-0.5, 0, 0));
//           break;

//         default:
//           break;
//       }
//     });

    //  this.customMethod(); // calling our custom method! (we could put spawning logic, collision logic etc in there ;) )

//     // example: spawn some stuff before the scene starts
//     // for (let i = 0; i < 10; i++) {
//     //     for (let j = 0; j < 10; j++) {
//     //         for (let k = 0; k < 10; k++) {
//     //             spawnObject({
//     //                 name: `new-Object${i}${j}${k}`,
//     //                 type: "cube",
//     //                 material: {
//     //                     diffuse: randomVec3(0, 1)
//     //                 },
//     //                 position: vec3.fromValues(4 - i, 5 - j, 10 - k),
//     //                 scale: vec3.fromValues(0.5, 0.5, 0.5)
//     //             }, this.state);
//     //         }
//     //     }
//     // }

//     // example: spawn in objects, set constantRotate to true for them (used below) and give them a collider
//     //   for (let i = 0; i < 2; i++) {
//     //     let tempObject = await spawnObject({
//     //       name: `new-Object${i}`,
//     //       type: "cube",
//     //       material: {
//     //         diffuse: randomVec3(0, 1)
//     //       },
//     //       position: vec3.fromValues(4 - i, 0, 0),
//     //       scale: vec3.fromValues(0.5, 0.5, 0.5)
//     //     }, this.state);


//     //     tempObject.constantRotate = true;         // lets add a flag so we can access it later
//     //     this.spawnedObjects.push(tempObject);     // add these to a spawned objects list
 //    this.collidableObjects.push(tempObject);  // say these can be collided into
//     //   }
//   }

//   // Runs once every frame non stop after the scene loads
//
//     // TODO - Here we can add game logic, like moving game objects, detecting collisions, you name it. Examples of functions can be found in sceneFunctions

//     // example: Rotate a single object we defined in our start method
//     // this.cube.rotate('x', deltaTime * 0.5);

//     // example: Rotate all objects in the scene marked with a flag
//     // this.state.objects.forEach((object) => {
//     //   if (object.constantRotate) {
//     //     object.rotate('y', deltaTime * 0.5);
//     //   }
//     });

//     // simulate a collision between the first spawned object and 'cube' 
//     // if (this.spawnedObjects[0].collidable) {
//     //     this.spawnedObjects[0].onCollide(this.cube);
//     // }

//     // example: Rotate all the 'spawned' objects in the scene
//     // this.spawnedObjects.forEach((object) => {
//     //     object.rotate('y', deltaTime * 0.5);
//     // });


//     // example - call our collision check method on our cube


onUpdate(deltaTime)
{

  this.sphereCollision(this.robber);
  this.boxSphereCollision(this.robber);
  
}
  
  

}

