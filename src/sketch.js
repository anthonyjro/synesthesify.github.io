import GradientCollection from './gradients.js' 
import Color from 'color';
/* 
* Object containing arrays of gradients expressed  
* as hexadecimal colors 
*/
const gradients = new GradientCollection();
const canvas_dmsn = {
  width: 1600,
  height: 800
}
// * Main function for the p5 component of the app

export function Sketch2D(p){
  
  let scale = 40.0; // Sets current scale for the visual being rendered
  let fillcolor = 'black';
  let gradient = gradients.g2D['tangerine']; // Current gradient selected
  let current_shape = 'star'; // Current shape for the visual
  let curr = 0; // Variable for iterating through gradient list 
  let factor = 0.2; // Speed at which shape increases/decreses size
  let maxscale = 10.0; // Maximum size for shape
  let minscale = 0.0; // Minimum ""
  let center = [0,0];
  let pause = false;

  function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
  }

  /* Function that creates the canvas and sets animation to loop */
  p.setup = () => {
      p.createCanvas(canvas_dmsn.width, canvas_dmsn.height, p.P2D);
      p.loop();
    }
  
  /* Updates values with props fed in by main app */
  p.updateWithProps = props => {
    if(props.gradient_flavor){
        gradient = gradients.g2D[props.gradient_flavor];
      }

      if(props.shape){
        current_shape = props.shape;
      }

      if(props.factor && props.scale){
        factor =  (props.factor / (60.0) * 0.25);
        scale = (-10.0) * props.scale;
      }

      pause = props.pause;
  };
    
  p.draw = () => {
    if(scale > maxscale){ // Shrink once max is reached
      scale = maxscale;
      factor *= -1;
    } else if(scale < minscale){ // Grow once min is reached
      scale = minscale;
      factor *= -1;
      center = [getRndInteger(-p.width/2, p.width/2),getRndInteger(-p.height/2, p.height/2)]
    }

    p.renderShape();
    scale += factor;
    curr = (curr + 1) % gradient.length;
  }

    /* Function that renders the currently selected shape. */
  p.renderShape = () => {
    p.push();
    p.translate(p.width/2, p.height/2)
    
    p.stroke(gradient[curr]);
    p.strokeWeight(4);
    p.fill(fillcolor);
    switch(current_shape){
      case 'star':
        p.rotate(p.frameCount / -100.0);
        p.star(0, 0, 15*scale, 35*scale, 5);
        break;
      case 'circle':
        p.ellipse(center[0], center[1], 35*scale, 35*scale);
        if(center[0] === 0 && center[1] === 0){
          p.clear();
        }
        break;
      case 'square':
        p.rotate(p.frameCount / -100.0);
        p.square(0,0,35*scale);
        break;
      default:
        break;
    }
    p.pop();
  }

  p.star = (x, y, radius1, radius2, npoints) => {
    let angle = p.TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    p.beginShape();
    for (let a = 0; a < p.TWO_PI; a += angle) {
      let sx = x + p.cos(a) * radius2;
      let sy = y + p.sin(a) * radius2;
      p.vertex(sx, sy);
      sx = x + p.cos(a + halfAngle) * radius1;
      sy = y + p.sin(a + halfAngle) * radius1;
      p.vertex(sx, sy);
    }
    p.endShape(p.CLOSE);
  }

  p.mouseClicked = () => 
  {
    if(pause){
      p.noLoop();
    } else {
      p.loop();
      p.clear();
    }
    
  };
}

export function Sketch3D(p){

  // let scale = 40.0; // Sets current scale for the visual being rendered
  let gradient = gradients.g3D['rainbow']; // Current gradient selected
  let current_shape = 'ball'; // Current shape for the visual
  let curr = 0; // Variable for iterating through gradient list 
  let factor = 10; // Speed at which shape increases/decreses size
  let tlite, blite = [0,0];

  let obj_size = 120;
  let boundary = 3.2;
  let ydir = 1;
  let ypos;
  let rgbfill;

  let cameras = [];
  let pause;

  let light_delta = 0;

  let next_cam = 0;

  let new_color = 0;

  p.setup = () => {
    p.createCanvas(canvas_dmsn.width, canvas_dmsn.height, p.WEBGL);
    p.loop();
    tlite = [0, 75 - p.height / 2];
    blite = [0, 700 - p.height / 2];
    ypos = p.height / 2;
    rgbfill = [0,0,0];
    cameras[0] = p.createCamera();    
    cameras[1] = p.createCamera();  
    cameras[2] = p.createCamera();
    cameras[0].lookAt(500,0,0);
    cameras[1].lookAt(500,0,0);
    cameras[1].lookAt(500,0,0);
    cameras[1].pan(1.5)
    cameras[1].move(1000,0,1000);
    cameras[2].move(500,-1000,0);
    cameras[2].tilt(1);
    
    p.setCamera(cameras[0]);
  }

  /* Updates values with props fed in by main app */
  p.updateWithProps = props => {
    if(props.gradient_flavor){
      gradient = gradients.g3D[props.gradient_flavor];
      rgbfill = Color(gradient[new_color]).rgb().array();
    }

    if(props.shape){
      current_shape = props.shape;
    }

    if(props.factor){
      factor =  (props.factor / 60.0 * 0.25) * 40;
      // scale = (-10.0) * props.scale;
    }

    pause = props.pause;
  };

  p.draw = () => {
    p.orbitControl();
    p.render3DShape();
    cameras[0].move(0,0,Math.sin(p.frameCount / 120)*5);
    cameras[1].move(0,0,Math.cos(p.frameCount / 120)*5);
    cameras[2].move(0,0,Math.cos(p.frameCount / 120)*5);
    if(p.frameCount % 120 === 0){
      next_cam = (next_cam + 1) % cameras.length;
      p.setCamera(cameras[next_cam]);
    }
    curr = (curr + 1) % gradient.length;
  }
  p.render3DShape = () => {
    p.background(Color(gradient[new_color]).darken(0.7).rgb().string());
    bouncer();
    p.specularColor(...rgbfill);
    p.pointLight(...rgbfill, ...tlite, 100);
    p.specularColor(...rgbfill);
    p.pointLight(...rgbfill, ...blite, 50);
    p.ambientLight(50);
    p.shininess(255);
    p.noStroke(255);
    for (let i = 0; i < gradient.length; i++) {
      p.push();
      p.rotateX(p.frameCount * 0.01);
      p.translate((obj_size+10), ypos);
      if(i % 2 === light_delta){
        p.emissiveMaterial(...Color(gradient[i]).rgb().array());
      } else {
        p.specularMaterial(...Color(gradient[i]).rgb().array());
      }
      
      

      switch(current_shape){
        case 'box':
          p.box(obj_size);
          break;
        case 'ball':
          p.sphere(obj_size);
          break;
        case 'donut':
          p.torus(obj_size, 15);
          break;
        default:
          break;
      }
      
    } p.pop();
  }

  function bouncer(){
    ypos += ydir * factor;
    if(ypos > p.height - obj_size * boundary || ypos < -p.height + obj_size * boundary){
      ydir *= -1;
      new_color = (new_color + 1) % gradient.length;
      light_delta = (light_delta + 1) % 2;
      rgbfill = Color(gradient[new_color]).rgb().array();
    }
  }

  p.mouseClicked = () => 
  {
    if(pause){
      p.noLoop();
    } else {
      p.loop();
    }
    
  };

  p.doubleClicked = () => {
    let fs = p.fullscreen();
    p.fullscreen(!fs);
  }

}
