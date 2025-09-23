/**
 * Chuyển đổi dữ liệu Sequelize (model instance hoặc array) 
 * sang object JSON thuần (plain object) an toàn, tái sử dụng được.
 */

class SequelizeToJson {
  /**
   * Chuyển đổi 1 instance hoặc mảng Sequelize thành JSON thuần
   * @param {*} data - Sequelize instance | array | null
   * @returns {Object|Array|null}
   */
  static convert(data) {
    if (!data) return null;

    // Nếu là mảng Sequelize => map từng phần tử
    if (Array.isArray(data)) {
      return data.map(item => SequelizeToJson.convert(item));
    }

    // Nếu là Sequelize model instance (có .get)
    if (typeof data.get === 'function') {
      return data.get({ plain: true });
    }

    // Nếu đã là object bình thường
    if (typeof data === 'object') {
      // Đệ quy để loại bỏ instance con (nếu có include)
      return Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, SequelizeToJson.convert(v)])
      );
    }

    // Trường hợp primitive (string, number, ...)
    return data;
  }
}

module.exports = SequelizeToJson;
