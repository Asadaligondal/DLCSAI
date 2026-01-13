import Goal from '@/models/Goal';

/**
 * Auto-assign goals to a student based on their disabilities, weaknesses, and strengths
 * @param {Object} student - Student object with disabilities, weaknesses, strengths, gradeLevel
 * @returns {Array} - Array of matching goal IDs
 */
export async function autoAssignGoals(student) {
  try {
    const { disabilities, weaknesses, strengths, gradeLevel } = student;

    // Find all active goals
    const allGoals = await Goal.find({ isActive: true });

    // Score each goal based on how well it matches the student
    const scoredGoals = allGoals.map(goal => {
      let score = 0;
      let matchReasons = [];

      // Check for disability matches
      if (goal.targetDisabilities && goal.targetDisabilities.length > 0) {
        const disabilityMatches = disabilities.filter(d =>
          goal.targetDisabilities.some(td =>
            td.toLowerCase().includes(d.toLowerCase()) ||
            d.toLowerCase().includes(td.toLowerCase())
          )
        );
        if (disabilityMatches.length > 0) {
          score += disabilityMatches.length * 3; // High weight for disability matches
          matchReasons.push(`Matches disabilities: ${disabilityMatches.join(', ')}`);
        }
      }

      // Check for weakness matches
      if (goal.targetWeaknesses && goal.targetWeaknesses.length > 0) {
        const weaknessMatches = weaknesses.filter(w =>
          goal.targetWeaknesses.some(tw =>
            tw.toLowerCase().includes(w.toLowerCase()) ||
            w.toLowerCase().includes(tw.toLowerCase())
          )
        );
        if (weaknessMatches.length > 0) {
          score += weaknessMatches.length * 2; // Medium weight for weakness matches
          matchReasons.push(`Addresses weaknesses: ${weaknessMatches.join(', ')}`);
        }
      }

      // Check if student has required strengths
      if (goal.requiredStrengths && goal.requiredStrengths.length > 0) {
        const strengthMatches = strengths.filter(s =>
          goal.requiredStrengths.some(rs =>
            rs.toLowerCase().includes(s.toLowerCase()) ||
            s.toLowerCase().includes(rs.toLowerCase())
          )
        );
        const strengthRatio = strengthMatches.length / goal.requiredStrengths.length;
        if (strengthRatio >= 0.5) { // At least 50% of required strengths
          score += strengthMatches.length * 1; // Lower weight for strength matches
          matchReasons.push(`Has required strengths: ${strengthMatches.join(', ')}`);
        } else if (strengthRatio > 0) {
          score -= 1; // Slight penalty if some but not enough strengths
        }
      }

      // Check grade level compatibility
      if (goal.gradeLevel && gradeLevel) {
        const goalGrades = goal.gradeLevel.toLowerCase();
        const studentGrade = gradeLevel.toLowerCase();

        // Simple grade matching (can be improved)
        if (goalGrades.includes(studentGrade) || studentGrade.includes(goalGrades)) {
          score += 1;
          matchReasons.push('Grade level appropriate');
        }
      }

      // Bonus for high priority goals if there's any match
      if (score > 0 && goal.priority === 'high') {
        score += 1;
      } else if (score > 0 && goal.priority === 'critical') {
        score += 2;
      }

      return {
        goalId: goal._id,
        goal,
        score,
        matchReasons
      };
    });

    // Filter goals with score > 0 and sort by score descending
    const matchedGoals = scoredGoals
      .filter(sg => sg.score > 0)
      .sort((a, b) => b.score - a.score);

    // Return top matching goal IDs (limit to top 5-10 goals)
    const topGoals = matchedGoals.slice(0, 8);

    return {
      goalIds: topGoals.map(g => g.goalId),
      matchDetails: topGoals.map(g => ({
        goalId: g.goalId,
        title: g.goal.title,
        category: g.goal.category,
        priority: g.goal.priority,
        score: g.score,
        matchReasons: g.matchReasons
      }))
    };
  } catch (error) {
    console.error('Auto-assign goals error:', error);
    throw error;
  }
}

/**
 * Get recommended goals for a student without auto-assigning
 * @param {Object} student - Student object
 * @returns {Array} - Array of recommended goals with match details
 */
export async function getRecommendedGoals(student) {
  try {
    const result = await autoAssignGoals(student);
    return result.matchDetails;
  } catch (error) {
    console.error('Get recommended goals error:', error);
    throw error;
  }
}
