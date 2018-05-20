import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { Category } from './category';
import { TFModel } from './tfmodel';
import * as SVG from 'svg.js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild('videoElement') videoElement: ElementRef;
  imageUpper = 10;
  previewNum = 4;
  imageHeight = 32;
  imageWidth = 32;
  thumbnailWidth = 50;
  thumbnailHeight = 50;
  hiddenCanvas: HTMLCanvasElement;
  thumbnailCanvas: HTMLCanvasElement;
  captureIntervals = 200;
  categories: Category[];
  timer: NodeJS.Timer;
  model: TFModel;
  video_on: boolean;
  training: boolean;
  model_ready: boolean;

  result: {
    name: string,
    prob: number,
    className: string,
  };

  ngOnInit(): void {
    this.categories = [];
    this.categories.push(new Category('开心', this.imageUpper, 0, 'happy'));
    this.categories.push(new Category('难过', this.imageUpper, 1, 'sad'));
    this.categories.push(new Category('吃醋', this.imageUpper, 2, 'jealous'));
    this.categories.push(new Category('星星眼', this.imageUpper, 3, 'stars'));
    this.model = new TFModel();
  
    this.hiddenCanvas = document.createElement('canvas');
    this.thumbnailCanvas = document.createElement('canvas');
    this.hiddenCanvas.width = this.imageWidth;
    this.hiddenCanvas.height = this.imageHeight;
    this.thumbnailCanvas.width = this.thumbnailWidth;
    this.thumbnailCanvas.height = this.thumbnailHeight;

    this.video_on = false;
    this.training = false;
    this.model_ready = false;
    this.result = {
      name: '结果',
      prob: 100,
      className: '',
    };

    const sepHeight = 380;
    const sepWidth = 60;

    setTimeout(() => {

      const leftSvg = SVG('leftSeperator').size(sepWidth, sepHeight);
      const leftOrigin = document.getElementById('leftOrigin');
      const leftPoints = document.getElementsByClassName('leftAnchor');
  
      const exX = 30;

      for (let i = 0; i < leftPoints.length; i++) {
        const yOffset = leftPoints[i].offsetTop - leftOrigin.offsetTop;
        const xOffset = sepWidth;
        const line = leftSvg.path(`M 0, ${sepHeight / 2} C ${exX}, ${sepHeight / 2}, ${sepWidth - exX}, ${sepHeight / 2 + yOffset}, ${sepWidth}, ${sepHeight / 2 + yOffset}`).fill('none');
        line.stroke({ color: '#f06', width: 10, linecap: 'round' });
      }

      const rightSvg = SVG('rightSeperator').size(sepWidth, sepHeight);
      const rightOrigin = document.getElementById('rightOrigin');
      const rightPoints = document.getElementsByClassName('rightAnchor');

      for (let i = 0; i < leftPoints.length; i++) {
        const yOffset = - leftPoints[i].offsetTop + rightOrigin.offsetTop;
        const line = rightSvg.path(`M 0, ${sepHeight / 2 + yOffset} C ${exX}, ${sepHeight / 2 + yOffset}, ${sepWidth - exX}, ${sepHeight / 2}, ${sepWidth}, ${sepHeight / 2}`).fill('none');
        line.stroke({ color: '#f06', width: 10, linecap: 'round' });
      }
    }, 500);



    setInterval(() => {
      if (this.model_ready && !this.training) {
        this.predict();
      }
    }, 1000);
  }

  startVideo() {
    const n = navigator as any;
    n.getUserMedia = n.getUserMedia ||
      n.webkitGetUserMedia || n.mozGetUserMedia ||
      n.msGetUserMedia || n.oGetUserMedia;

    if (navigator.getUserMedia) {
      navigator.getUserMedia(
        {video: true},
        this.handleVideo.bind(this),
        this.handleVideoError.bind(this)
      );
    }
    this.video_on = true;
  }

  handleVideo(stream: MediaStream) {
    (this.videoElement.nativeElement as HTMLVideoElement).srcObject = stream;
  }

  handleVideoError(error) {
    console.log(error);
  }


  startCapture(category: Category): void {
    if (this.training) {
      return;
    }
    if (!this.video_on) {
      alert('先点击左侧『开启摄像头』哦！');
      return;
    }
    if (!this.timer) {
      category.clear();
      this.timer = setInterval(() => { this.takePicture(category); }, this.captureIntervals);
    }
  }

  stopCapture(): void {
    clearInterval(this.timer);
    this.timer = null;
    this.train();
  }

  takePicture(category: Category): void {
    this.hiddenCanvas.getContext('2d').drawImage(this.videoElement.nativeElement, 0, 0, this.hiddenCanvas.width, this.hiddenCanvas.height);

    const img = this.hiddenCanvas.getContext('2d').getImageData(0, 0, this.hiddenCanvas.width, this.hiddenCanvas.height);

    if (!category.pushImage(img)) {
      this.stopCapture();
    } else {
      if (category.images.length < this.previewNum) {
        this.thumbnailCanvas.getContext('2d').drawImage(this.videoElement.nativeElement, 0, 0, 50, 50);
        const thumbnail = this.thumbnailCanvas.toDataURL();
        category.pushThumbnailImage(thumbnail);
      }
    }
  }

  train(): void {
    this.training = true;
    const ys = Array.prototype.concat(... this.categories.map((el) => {
      if (el.thumbnailImages.length > 0) {
        return el.labels;
      } else {
        return [];
      }
    }));

    const xs = Array.prototype.concat(...this.categories.map((el) => {
      if (el.thumbnailImages.length > 0) {
        return el.images;
      } else {
        return [];
      }
    }));

    const p = this.model.train(this.categories.length, xs, ys, this.imageHeight, this.imageWidth);
    p.then(() => {
      this.training = false;
      this.model_ready = true;
    });
  }

  predict(): void {
    this.hiddenCanvas.getContext('2d').drawImage(this.videoElement.nativeElement, 0, 0, this.hiddenCanvas.width, this.hiddenCanvas.height);
    const img = this.hiddenCanvas.getContext('2d').getImageData(0, 0, this.hiddenCanvas.width, this.hiddenCanvas.height);
    const result = this.model.predict(img);
    let maxIndex = 0;
    for (let i = 1; i < result.length; i++) {
      if (result[i] > result[maxIndex]) {
        maxIndex = i;
      }
    }
    this.result = {
      name: this.categories[maxIndex].name,
      prob: Math.floor(result[maxIndex] * 100),
      className: this.categories[maxIndex].className,
    };
  }
}
