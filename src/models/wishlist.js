module.exports = (sequelize, DataTypes) => {
    const Wishlist = sequelize.define('Wishlist', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        product_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'products',
                key: 'id'
            }
        }
    }, {
        tableName: 'wishlists',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'product_id']
            }
        ]
    });

    Wishlist.associate = function (models) {
        Wishlist.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        Wishlist.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
    };

    return Wishlist;
};
