export class Category {
    name: string;
    images: ImageData[];
    labels: Array<number>;
    imageUpper: number;
    categoryId: number;
    thumbnailImages: string[];
    className: string;
    constructor(name: string, imageUpper: number, categoryId: number, className: string) {
        this.name = name;
        this.imageUpper = imageUpper;
        this.labels = new Array(imageUpper);
        this.labels.fill(categoryId);
        this.categoryId = categoryId;
        this.images = [];
        this.thumbnailImages = [];
        this.className = className;
    }

    clear() {
        this.images = [];
        this.thumbnailImages = [];
    }

    pushImage(img: ImageData): boolean {
        if (this.images.length >= this.imageUpper) {
            return false;
        } else {
            this.images.push(img);
            return true;
        }
    }

    pushThumbnailImage(img: string): void {
        this.thumbnailImages.push(img);
    }
}