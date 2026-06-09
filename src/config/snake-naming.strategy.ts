import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils';

/**
 * 自动把 camelCase 字段名转成 snake_case 数据库列名
 * 跟 init.sql 里的列名保持一致
 */
export class SnakeNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string {
    return customName || snakeCase(propertyName);
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return snakeCase(referencedColumnName);
  }

  joinTableColumnName(tableName: string, propertyName: string, columnName?: string): string {
    return snakeCase(columnName || propertyName);
  }
}
