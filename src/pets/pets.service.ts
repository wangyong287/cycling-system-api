import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet, PET_TYPES, PetType } from './entities/pet.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PetsService {
  constructor(
    @InjectRepository(Pet)
    private petRepository: Repository<Pet>,
  ) {}

  // 领取宠物（免费每人一只）
  async adopt(userId: string, petType: string, name: string): Promise<Pet> {
    // 检查是否已有宠物
    const existPet = await this.petRepository.findOne({
      where: { userId, status: 'active' as any },
    });

    if (existPet) {
      throw new Error('每人只能领养一只宠物');
    }

    // 验证宠物类型
    const validTypes = Object.values(PET_TYPES);
    if (!validTypes.includes(petType as PetType)) {
      throw new Error('不支持的宠物类型');
    }

    const pet = this.petRepository.create({
      userId,
      petType,
      name: name || this.getDefaultName(petType),
      intimacy: 0,
      energy: 100,
      level: 1,
    });

    return this.petRepository.save(pet);
  }

  // 获取用户宠物
  async findByUserId(userId: string): Promise<Pet | null> {
    return this.petRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // 获取宠物详情
  async findById(id: string): Promise<Pet> {
    const pet = await this.petRepository.findOne({ where: { id } });
    if (!pet) {
      throw new NotFoundException('宠物不存在');
    }
    return pet;
  }

  // 增加亲密度（骑行完成后）
  async addIntimacy(petId: string, amount: number = 10): Promise<Pet> {
    const pet = await this.findById(petId);
    pet.intimacy += amount;

    // 检查升级
    const nextLevelIntimacy = pet.level * 100;
    if (pet.intimacy >= nextLevelIntimacy) {
      pet.level += 1;
    }

    return this.petRepository.save(pet);
  }

  // 消耗能量
  async consumeEnergy(petId: string, amount: number): Promise<Pet> {
    const pet = await this.findById(petId);
    pet.energy = Math.max(0, pet.energy - amount);
    return this.petRepository.save(pet);
  }

  // 喂养宠物（增加能量）
  async feed(petId: string, foodType: string): Promise<Pet> {
    const pet = await this.findById(petId);

    const energyRestore: Record<string, number> = {
      能量: 20,
      力量: 30,
      恢复: 50,
    };

    const restore = energyRestore[foodType] || 10;
    pet.energy = Math.min(100, pet.energy + restore);

    return this.petRepository.save(pet);
  }

  // 获取默认名字
  private getDefaultName(petType: string): string {
    const defaults: Record<string, string> = {
      边境牧羊犬: '旺财',
      金毛: '小金',
      柯基: '柯基',
      柴犬: '柴柴',
      哈士奇: '二哈',
      泰迪: '迪迪',
      英短: '英短',
      布偶: '布丁',
      暹罗: '暹暹',
      荷兰垂耳兔: '兔兔',
      金丝熊: '熊仔',
      荷兰猪: '猪猪',
    };
    return defaults[petType] || '小宠';
  }

  // 获取可领养的宠物类型列表
  getAvailableTypes(): { type: string; name: string }[] {
    return Object.entries(PET_TYPES).map(([key, value]) => ({
      type: key,
      name: value,
    }));
  }
}