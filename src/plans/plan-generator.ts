import { PlanGoal, PlanLevel, WeekPlan, DailyWorkout } from './entities/plan.entity';
import { GeneratePlanDto } from './dto/generate-plan.dto';

export class PlanGenerator {
  static generate(dto: Pick<GeneratePlanDto, 'goal' | 'level' | 'daysPerWeek' | 'durationWeeks'>) {
    const { goal, level, daysPerWeek, durationWeeks } = dto;
    const weeks: WeekPlan[] = [];
    const intensity = this.getIntensityFactor(level);
    for (let w = 1; w <= durationWeeks; w++) {
      const weekTheme = this.getWeekTheme(w, durationWeeks, goal);
      const workouts = this.buildWeekWorkouts(w, daysPerWeek, goal, intensity, durationWeeks);
      const totalMin = workouts.reduce((s, wo) => s + wo.durationMin, 0);
      weeks.push({ week: w, theme: weekTheme, totalDurationMin: totalMin, workouts });
    }
    return {
      name: this.generateName(goal, level, durationWeeks),
      description: this.generateDescription(goal, level, daysPerWeek, durationWeeks),
      structure: weeks,
      estimatedCalories: this.estimateCalories(weeks, goal),
    };
  }
  private static getIntensityFactor(level: PlanLevel): number {
    return { beginner: 0.7, intermediate: 1.0, advanced: 1.3, expert: 1.6 }[level] ?? 1.0;
  }
  private static getWeekTheme(week: number, total: number, _goal: PlanGoal): string {
    const ratio = week / total;
    if (ratio <= 0.25) return '基础适应期';
    if (ratio <= 0.5) return '强度爬升期';
    if (ratio <= 0.75) return '巅峰训练期';
    if (ratio <= 0.9) return '巩固提升期';
    return '恢复调整期';
  }
  private static buildWeekWorkouts(weekNum: number, daysPerWeek: number, goal: PlanGoal, intensity: number, totalWeeks: number): DailyWorkout[] {
    const weekPhase = this.getPhaseIntensity(weekNum, totalWeeks);
    const workouts: DailyWorkout[] = [];
    const pattern = this.getWeeklyPattern(goal, daysPerWeek);
    for (let d = 1; d <= 7; d++) {
      const slot = pattern[d - 1];
      if (!slot) {
        workouts.push({ day: d, type: 'rest', durationMin: 0, intensity: 'low', description: '休息日' });
        continue;
      }
      workouts.push(this.buildWorkout(d, slot, goal, intensity * weekPhase));
    }
    return workouts;
  }
  private static getPhaseIntensity(week: number, total: number): number {
    return 0.6 + (week / total) * 0.6;
  }
  private static getWeeklyPattern(goal: PlanGoal, daysPerWeek: number): Array<{ type: DailyWorkout['type']; intensity: DailyWorkout['intensity'] } | null> {
    const goalPattern: Record<PlanGoal, Array<DailyWorkout['type'] | null>> = {
      fat_burn: [null, 'endurance', 'interval', null, 'endurance', 'mixed', 'interval'],
      endurance: [null, 'endurance', 'recovery', 'endurance', 'interval', 'endurance', null],
      strength: [null, 'strength', 'recovery', 'strength', 'interval', 'strength', null],
      rehab: [null, 'recovery', null, 'recovery', 'mixed', null, 'recovery'],
      weight_loss: [null, 'endurance', 'interval', null, 'endurance', 'interval', 'mixed'],
      competition: [null, 'interval', 'endurance', 'strength', 'interval', 'endurance', 'recovery'],
    };
    const arr = goalPattern[goal] ?? goalPattern.endurance;
    const result: Array<{ type: DailyWorkout['type']; intensity: DailyWorkout['intensity'] } | null> = [];
    let picked = 0;
    for (let i = 0; i < arr.length && picked < daysPerWeek; i++) {
      const t = arr[i];
      if (t) { result.push({ type: t, intensity: this.intensityForType(t) }); picked++; }
      else { result.push(null); }
    }
    while (result.length < 7) result.push(null);
    return result;
  }
  private static intensityForType(type: DailyWorkout['type']): DailyWorkout['intensity'] {
    const map: Record<DailyWorkout['type'], DailyWorkout['intensity']> = {
      endurance: 'moderate', interval: 'high', strength: 'high',
      recovery: 'low', mixed: 'moderate', rest: 'low',
    };
    return map[type] ?? 'moderate';
  }
  private static buildWorkout(day: number, slot: { type: DailyWorkout['type']; intensity: DailyWorkout['intensity'] }, _goal: PlanGoal, intensity: number): DailyWorkout {
    const baseDuration = slot.type === 'interval' ? 45 : slot.type === 'endurance' ? 60 : 30;
    return {
      day, type: slot.type,
      durationMin: Math.round(baseDuration * intensity),
      intensity: slot.intensity,
      description: `${slot.type} 训练，强度 ${intensity.toFixed(2)}`,
    };
  }
  private static estimateCalories(weeks: WeekPlan[], _goal: PlanGoal): number {
    return weeks.reduce((sum, w) => sum + w.totalDurationMin * 8, 0);
  }
  private static generateName(goal: PlanGoal, level: PlanLevel, weeks: number): string {
    const goalName: Record<PlanGoal, string> = { fat_burn: '燃脂', endurance: '耐力', strength: '力量', rehab: '康复', weight_loss: '减脂', competition: '备赛' };
    const levelName: Record<PlanLevel, string> = { beginner: '入门', intermediate: '进阶', advanced: '高级', expert: '专业' };
    return `${levelName[level]}${goalName[goal]} ${weeks} 周计划`;
  }
  private static generateDescription(goal: PlanGoal, level: PlanLevel, days: number, weeks: number): string {
    return `针对 ${level} 用户，每周 ${days} 天，共 ${weeks} 周的 ${goal} 训练计划`;
  }
}
