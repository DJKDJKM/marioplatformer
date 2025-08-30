# Mario Platformer

A classic-style Mario platformer game built with HTML5 Canvas and JavaScript. Features procedurally generated levels, multiple power-ups, enemies, and endless gameplay.

## 🎮 Play the Game

Simply open `index.html` in your web browser to start playing!

## ✨ Features

- **Endless Procedural Levels**: The game generates new platforms, enemies, and obstacles as you progress
- **Multiple Power-ups**:
  - 🍄 **Size Mushroom**: Makes Mario bigger and stronger
  - 🌺 **Fire Flower**: Allows Mario to shoot fireballs
  - ⭐ **Star Power**: Temporary invincibility with rainbow flashing
  - ⚡ **Speed Boost**: Increases movement speed temporarily  
  - 💚 **1-Up Mushroom**: Extra life
- **Enemy System**: Goombas that patrol platforms
- **Physics Engine**: Realistic jumping, gravity, and collision detection
- **Scoring System**: Collect coins and defeat enemies for points
- **Lives System**: Start with 3 lives, gain more with 1-Up mushrooms
- **Progressive Difficulty**: Levels get harder as you advance

## 🎯 Controls

- **Arrow Keys**: Move left and right
- **Spacebar**: Jump
- **X Key**: Shoot fireballs (when you have fire power)

## 🎨 Game Elements

### Power-ups
- **Red Mushroom**: Basic size power-up
- **Orange Fire Flower**: Enables fireball shooting
- **Golden Star**: 10 seconds of invincibility
- **Blue Lightning**: Speed boost for 5 seconds
- **Green Mushroom**: Extra life

### Enemies
- **Goombas**: Brown enemies that walk back and forth on platforms
  - Jump on them to defeat them (100 points)
  - Shoot them with fireballs (200 points)
  - Touching them from the side causes damage

### Collectibles
- **Gold Coins**: 50 points each
- **Power-ups**: 150-1000 points depending on type

## 🏗️ Technical Details

- Built with vanilla JavaScript and HTML5 Canvas
- No external dependencies
- Responsive game loop using `requestAnimationFrame`
- Object-oriented design with separate classes for game entities
- Dynamic camera system that follows the player
- Efficient rendering with viewport culling

## 🚀 Level Generation

The game features an intelligent level generation system that creates:
- Ground platforms for the base level
- Floating platforms at various heights
- Pipe obstacles
- Strategic placement of enemies, coins, and power-ups
- Progressive difficulty scaling

## 📁 Project Structure

```
mario_platformer/
├── index.html      # Main HTML file
├── style.css       # Game styling
├── game.js         # Game logic and classes
└── README.md       # This file
```

## 🎯 Gameplay Tips

1. **Power-up Strategy**: Fire flowers are powerful but you lose them when hit - play carefully!
2. **Star Power**: Use invincibility time to run through enemies and dangerous areas
3. **Speed Boost**: Great for making long jumps and escaping tight situations
4. **Fireball Combat**: Fireballs can clear multiple enemies quickly for big point bonuses
5. **Exploration**: Look for hidden coins and power-ups above platforms

## 🔧 Customization

The game is built with modular code that's easy to modify:
- Adjust game physics in the Mario class
- Add new power-up types by extending the PowerUp class
- Modify level generation parameters in the Game class
- Change visual styles in the draw methods

## 📜 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feel free to fork this project and submit pull requests for improvements!

---

**Enjoy playing! 🎮**