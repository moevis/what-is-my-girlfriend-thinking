import * as tf from '@tensorflow/tfjs';
import { History } from '@tensorflow/tfjs-layers/dist/callbacks';

export class TFModel {
    model: tf.Sequential;
    num_of_class: number;
    image_width: number;
    image_height: number;
    learning_rate: 0.001;

    build_model() {
        this.model = new tf.Sequential();
        // this.model.add(tf.layers.reshape({
        //     inputShape: [this.image_height * this.image_width * 3],
        //     targetShape: [this.image_height, this.image_width, 3],
        // }));
        // this.model.add(tf.layers.flatten({
        //     inputShape: [this.image_height, this.image_width, 3]

        // }));
        // this.model.add(tf.layers.dense({ units: 100, activation: 'relu'}));
        // this.model.add(tf.layers.dense({ units: this.num_of_class, activation: 'softmax'}));

        this.model.add(tf.layers.conv2d({
            kernelSize: 3,
            inputShape: [this.image_width, this.image_height, 3],
            filters: 32,
            strides: 1,
            activation: 'relu',
        }));

        this.model.add(tf.layers.maxPooling2d({
            strides: [2, 2],
            poolSize: 2,
        }));

        this.model.add(tf.layers.conv2d({
            kernelSize: 3,
            filters: 32,
            strides: 1,
            activation: 'relu',
        }));

        this.model.add(tf.layers.maxPooling2d({
            strides: [2, 2],
            poolSize: 2,
        }));

        this.model.add(tf.layers.flatten());

        this.model.add(tf.layers.dense({
            units: 128,
            activation: 'relu',
        }));

        this.model.add(tf.layers.dense({
            units: 32,
            activation: 'relu',
        }));

        this.model.add(tf.layers.dense({
            units: this.num_of_class,
            activation: 'softmax',
        }));

        const optimizer = tf.train.adam(this.learning_rate);

        this.model.compile({
            optimizer: optimizer,
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy'],
        });
    }
    // async train() {

    // }

    async train(num_of_class: number, xs: ImageData[], ys: Array<number>, height, width): Promise<History> {

        this.num_of_class = num_of_class;
        this.image_height = height;
        this.image_width = width;

        // const y_data_tf = tf.tensor(y_data, 'int32');
        // const x_data_tf = tf.tensor(x_data).reshape([-1, this.image_height, this.image_width, 1]);


        let image_xs = xs.map((d) => {
            const pixels = tf.fromPixels(d, 3);
            return pixels.toFloat().div(tf.scalar(127)).sub(tf.scalar(1));
        });

        const x_data = tf.keep(tf.stack(image_xs, 0));

        const y_data = tf.keep(tf.oneHot(tf.tensor1d(ys, 'int32'), this.num_of_class));

        this.build_model();

        const p = this.model.fit(x_data, y_data, {
            batchSize: 16,
            epochs: 20,
            callbacks: {
                onBatchEnd: async (batch, logs) => {
                    console.log('Loss: ' + logs.loss.toFixed(5));
                    await tf.nextFrame();
                }
            }
        });
        return p;
    }
    predict(image: ImageData): Array<number> {
        let pixels = tf.fromPixels(image, 3).toFloat().div(tf.scalar(127)).sub(tf.scalar(1));
        pixels = pixels.reshape([1, this.image_height, this.image_width, 3]);
        const result = this.model.predict(pixels) as any;
        return Array.from(result.dataSync());
    }
}