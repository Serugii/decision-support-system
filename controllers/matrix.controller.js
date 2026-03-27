import matrixService from '../services/matrix.service.js';

class MatrixController {
  async getMatrix(request, reply) {
    const result = await matrixService.getMatrix();
    reply.send(result);
  }
}

export default new MatrixController();
