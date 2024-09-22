class Arena {
    constructor(width, height, matrixService) {
        this.width = width;
        this.height = height;
        this.matrix = matrixService.createMatrix(width, height);
    }
}