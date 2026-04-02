class DecisionService {
  calculate() {
    throw new Error('Not implemented yet');
  }

  rankAlternatives() {
    throw new Error('Not implemented yet');
  }
}

export default new DecisionService();

export function analyzeMatrix(matrix, criteria, alternatives) {
  const additive = [];
  const multiplicative = [];
  const cautious = [];

  const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 1), 0);

  const getWeight = (criterion) => (criterion.weight || 1) / totalWeight;

  for (let i = 0; i < matrix.length; i++) {
    const row = matrix[i];

    let additiveScore = 0;
    let multiplicativeScore = 1;
    let cautiousValues = [];

    for (let j = 0; j < criteria.length; j++) {
      const criterion = criteria[j];
      const critId = criterion._id;

      const item = row.criteria[critId];
      if (!item) continue;

      let value = Number(item.value);

      if (isNaN(value)) continue;

      const weight = getWeight(criterion);

      if (criterion.type === 'minimize') {
        if (value === 0) value = 0.0001;
        value = 1 / value;
      }

      additiveScore += value * weight;

      multiplicativeScore *= Math.pow(value, weight);

      cautiousValues.push(value * weight);
    }

    const cautiousScore =
      cautiousValues.length > 0 ? Math.min(...cautiousValues) : 0;

    additive.push({ alt: row.alternative, score: additiveScore });
    multiplicative.push({
      alt: row.alternative,
      score: multiplicativeScore,
    });
    cautious.push({ alt: row.alternative, score: cautiousScore });
  }

  return {
    additive: additive,
    multiplicative: multiplicative,
    cautious: cautious,
  };
}
