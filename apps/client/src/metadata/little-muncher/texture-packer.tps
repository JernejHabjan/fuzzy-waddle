<?xml version="1.0" encoding="UTF-8"?>
<data version="1.0">
    <struct type="Settings">
        <key>fileFormatVersion</key>
        <int>6</int>
        <key>texturePackerVersion</key>
        <string>7.0.2</string>
        <key>autoSDSettings</key>
        <array>
            <struct type="AutoSDSettings">
                <key>scale</key>
                <double>1</double>
                <key>extension</key>
                <string></string>
                <key>spriteFilter</key>
                <string></string>
                <key>acceptFractionalValues</key>
                <false/>
                <key>maxTextureSize</key>
                <QSize>
                    <key>width</key>
                    <int>-1</int>
                    <key>height</key>
                    <int>-1</int>
                </QSize>
            </struct>
        </array>
        <key>allowRotation</key>
        <false/>
        <key>shapeDebug</key>
        <false/>
        <key>dpi</key>
        <uint>72</uint>
        <key>dataFormat</key>
        <string>phaser</string>
        <key>textureFileName</key>
        <filename></filename>
        <key>flipPVR</key>
        <false/>
        <key>pvrQualityLevel</key>
        <uint>3</uint>
        <key>astcQualityLevel</key>
        <uint>2</uint>
        <key>basisUniversalQualityLevel</key>
        <uint>2</uint>
        <key>etc1QualityLevel</key>
        <uint>70</uint>
        <key>etc2QualityLevel</key>
        <uint>70</uint>
        <key>dxtCompressionMode</key>
        <enum type="SettingsBase::DxtCompressionMode">DXT_PERCEPTUAL</enum>
        <key>ditherType</key>
        <enum type="SettingsBase::DitherType">PngQuantLow</enum>
        <key>backgroundColor</key>
        <uint>0</uint>
        <key>libGdx</key>
        <struct type="LibGDX">
            <key>filtering</key>
            <struct type="LibGDXFiltering">
                <key>x</key>
                <enum type="LibGDXFiltering::Filtering">Linear</enum>
                <key>y</key>
                <enum type="LibGDXFiltering::Filtering">Linear</enum>
            </struct>
        </struct>
        <key>shapePadding</key>
        <uint>0</uint>
        <key>jpgQuality</key>
        <uint>80</uint>
        <key>pngOptimizationLevel</key>
        <uint>1</uint>
        <key>webpQualityLevel</key>
        <uint>101</uint>
        <key>textureSubPath</key>
        <string></string>
        <key>textureFormat</key>
        <enum type="SettingsBase::TextureFormat">png8</enum>
        <key>borderPadding</key>
        <uint>0</uint>
        <key>maxTextureSize</key>
        <QSize>
            <key>width</key>
            <int>2048</int>
            <key>height</key>
            <int>2048</int>
        </QSize>
        <key>fixedTextureSize</key>
        <QSize>
            <key>width</key>
            <int>-1</int>
            <key>height</key>
            <int>-1</int>
        </QSize>
        <key>algorithmSettings</key>
        <struct type="AlgorithmSettings">
            <key>algorithm</key>
            <enum type="AlgorithmSettings::AlgorithmId">MaxRects</enum>
            <key>freeSizeMode</key>
            <enum type="AlgorithmSettings::AlgorithmFreeSizeMode">Best</enum>
            <key>sizeConstraints</key>
            <enum type="AlgorithmSettings::SizeConstraints">AnySize</enum>
            <key>forceSquared</key>
            <false/>
            <key>maxRects</key>
            <struct type="AlgorithmMaxRectsSettings">
                <key>heuristic</key>
                <enum type="AlgorithmMaxRectsSettings::Heuristic">Best</enum>
            </struct>
            <key>basic</key>
            <struct type="AlgorithmBasicSettings">
                <key>sortBy</key>
                <enum type="AlgorithmBasicSettings::SortBy">Best</enum>
                <key>order</key>
                <enum type="AlgorithmBasicSettings::Order">Ascending</enum>
            </struct>
            <key>polygon</key>
            <struct type="AlgorithmPolygonSettings">
                <key>alignToGrid</key>
                <uint>1</uint>
            </struct>
        </struct>
        <key>dataFileNames</key>
        <map type="GFileNameMap">
            <key>json</key>
            <struct type="DataFile">
                <key>name</key>
                <filename>../../assets/little-muncher/spritesheets/little-muncher-spritesheet.json</filename>
            </struct>
        </map>
        <key>multiPackMode</key>
        <enum type="SettingsBase::MultiPackMode">MultiPackOff</enum>
        <key>forceIdenticalLayout</key>
        <false/>
        <key>outputFormat</key>
        <enum type="SettingsBase::OutputFormat">RGBA8888</enum>
        <key>alphaHandling</key>
        <enum type="SettingsBase::AlphaHandling">ClearTransparentPixels</enum>
        <key>contentProtection</key>
        <struct type="ContentProtection">
            <key>key</key>
            <string></string>
        </struct>
        <key>autoAliasEnabled</key>
        <true/>
        <key>trimSpriteNames</key>
        <true/>
        <key>prependSmartFolderName</key>
        <true/>
        <key>autodetectAnimations</key>
        <true/>
        <key>globalSpriteSettings</key>
        <struct type="SpriteSettings">
            <key>scale</key>
            <double>1</double>
            <key>scaleMode</key>
            <enum type="ScaleMode">Smooth</enum>
            <key>extrude</key>
            <uint>0</uint>
            <key>trimThreshold</key>
            <uint>1</uint>
            <key>trimMargin</key>
            <uint>0</uint>
            <key>trimMode</key>
            <enum type="SpriteSettings::TrimMode">Trim</enum>
            <key>tracerTolerance</key>
            <int>200</int>
            <key>heuristicMask</key>
            <false/>
            <key>defaultPivotPoint</key>
            <point_f>0.5,0.5</point_f>
            <key>writePivotPoints</key>
            <false/>
        </struct>
        <key>individualSpriteSettings</key>
        <map type="IndividualSpriteSettingsMap">
            <key type="filename">background.png</key>
            <struct type="IndividualSpriteSettings">
                <key>pivotPoint</key>
                <point_f>0.5,0.5</point_f>
                <key>spriteScale</key>
                <double>1</double>
                <key>scale9Enabled</key>
                <false/>
                <key>scale9Borders</key>
                <rect>64,128,128,256</rect>
                <key>scale9Paddings</key>
                <rect>64,128,128,256</rect>
                <key>scale9FromFile</key>
                <false/>
            </struct>
            <key type="filename">bird/0.png</key>
            <key type="filename">bird/1.png</key>
            <key type="filename">bird/2.png</key>
            <key type="filename">bird/3.png</key>
            <key type="filename">bird/4.png</key>
            <key type="filename">bird/5.png</key>
            <key type="filename">bird/6.png</key>
            <key type="filename">bird/7.png</key>
            <key type="filename">bird/8.png</key>
            <key type="filename">bird/9.png</key>
            <key type="filename">cake1.png</key>
            <key type="filename">cake2.png</key>
            <key type="filename">cake3.png</key>
            <key type="filename">cake4.png</key>
            <struct type="IndividualSpriteSettings">
                <key>pivotPoint</key>
                <point_f>0.5,0.5</point_f>
                <key>spriteScale</key>
                <double>1</double>
                <key>scale9Enabled</key>
                <false/>
                <key>scale9Borders</key>
                <rect>8,8,16,16</rect>
                <key>scale9Paddings</key>
                <rect>8,8,16,16</rect>
                <key>scale9FromFile</key>
                <false/>
            </struct>
            <key type="filename">character/death/1.png</key>
            <key type="filename">character/death/2.png</key>
            <key type="filename">character/death/3.png</key>
            <key type="filename">character/death/4.png</key>
            <key type="filename">character/death/5.png</key>
            <key type="filename">character/death/6.png</key>
            <key type="filename">character/idle/1.png</key>
            <key type="filename">character/idle/2.png</key>
            <key type="filename">character/idle/3.png</key>
            <key type="filename">character/idle/4.png</key>
            <key type="filename">character/victory/back/1.png</key>
            <key type="filename">character/victory/back/2.png</key>
            <key type="filename">character/victory/back/3.png</key>
            <key type="filename">character/victory/back/4.png</key>
            <key type="filename">character/victory/back/5.png</key>
            <key type="filename">character/victory/back/6.png</key>
            <key type="filename">character/victory/front/1.png</key>
            <key type="filename">character/victory/front/2.png</key>
            <key type="filename">character/victory/front/3.png</key>
            <key type="filename">character/victory/front/4.png</key>
            <key type="filename">character/victory/front/5.png</key>
            <key type="filename">character/victory/front/6.png</key>
            <key type="filename">character/walk/back/1.png</key>
            <key type="filename">character/walk/back/2.png</key>
            <key type="filename">character/walk/back/3.png</key>
            <key type="filename">character/walk/back/4.png</key>
            <key type="filename">character/walk/back/5.png</key>
            <key type="filename">character/walk/back/6.png</key>
            <key type="filename">character/walk/back/7.png</key>
            <key type="filename">character/walk/back/8.png</key>
            <key type="filename">character/walk/back/9.png</key>
            <key type="filename">character/walk/front/1.png</key>
            <key type="filename">character/walk/front/2.png</key>
            <key type="filename">character/walk/front/3.png</key>
            <key type="filename">character/walk/front/4.png</key>
            <key type="filename">character/walk/front/5.png</key>
            <key type="filename">character/walk/front/6.png</key>
            <key type="filename">character/walk/front/7.png</key>
            <key type="filename">character/walk/front/8.png</key>
            <key type="filename">character/walk/front/9.png</key>
            <key type="filename">character/walk/left/1.png</key>
            <key type="filename">character/walk/left/2.png</key>
            <key type="filename">character/walk/left/3.png</key>
            <key type="filename">character/walk/left/4.png</key>
            <key type="filename">character/walk/left/5.png</key>
            <key type="filename">character/walk/left/6.png</key>
            <key type="filename">character/walk/left/7.png</key>
            <key type="filename">character/walk/left/8.png</key>
            <key type="filename">character/walk/left/9.png</key>
            <key type="filename">character/walk/right/1.png</key>
            <key type="filename">character/walk/right/2.png</key>
            <key type="filename">character/walk/right/3.png</key>
            <key type="filename">character/walk/right/4.png</key>
            <key type="filename">character/walk/right/5.png</key>
            <key type="filename">character/walk/right/6.png</key>
            <key type="filename">character/walk/right/7.png</key>
            <key type="filename">character/walk/right/8.png</key>
            <key type="filename">character/walk/right/9.png</key>
            <key type="filename">rock.png</key>
            <struct type="IndividualSpriteSettings">
                <key>pivotPoint</key>
                <point_f>0.5,0.5</point_f>
                <key>spriteScale</key>
                <double>1</double>
                <key>scale9Enabled</key>
                <false/>
                <key>scale9Borders</key>
                <rect>16,16,32,32</rect>
                <key>scale9Paddings</key>
                <rect>16,16,32,32</rect>
                <key>scale9FromFile</key>
                <false/>
            </struct>
            <key type="filename">health.png</key>
            <struct type="IndividualSpriteSettings">
                <key>pivotPoint</key>
                <point_f>0.5,0.5</point_f>
                <key>spriteScale</key>
                <double>1</double>
                <key>scale9Enabled</key>
                <false/>
                <key>scale9Borders</key>
                <rect>4,4,8,8</rect>
                <key>scale9Paddings</key>
                <rect>4,4,8,8</rect>
                <key>scale9FromFile</key>
                <false/>
            </struct>
            <key type="filename">tree.png</key>
            <struct type="IndividualSpriteSettings">
                <key>pivotPoint</key>
                <point_f>0.5,0.5</point_f>
                <key>spriteScale</key>
                <double>1</double>
                <key>scale9Enabled</key>
                <false/>
                <key>scale9Borders</key>
                <rect>16,32,32,64</rect>
                <key>scale9Paddings</key>
                <rect>16,32,32,64</rect>
                <key>scale9FromFile</key>
                <false/>
            </struct>
        </map>
        <key>fileLists</key>
        <map type="SpriteSheetMap">
            <key>default</key>
            <struct type="SpriteSheet">
                <key>files</key>
                <array>
                    <filename>background.png</filename>
                    <filename>bird</filename>
                    <filename>cake1.png</filename>
                    <filename>cake2.png</filename>
                    <filename>cake3.png</filename>
                    <filename>cake4.png</filename>
                    <filename>character</filename>
                    <filename>rock.png</filename>
                    <filename>tree.png</filename>
                    <filename>health.png</filename>
                </array>
            </struct>
        </map>
        <key>ignoreFileList</key>
        <array/>
        <key>replaceList</key>
        <array/>
        <key>ignoredWarnings</key>
        <array/>
        <key>commonDivisorX</key>
        <uint>1</uint>
        <key>commonDivisorY</key>
        <uint>1</uint>
        <key>packNormalMaps</key>
        <false/>
        <key>autodetectNormalMaps</key>
        <true/>
        <key>normalMapFilter</key>
        <string></string>
        <key>normalMapSuffix</key>
        <string></string>
        <key>normalMapSheetFileName</key>
        <filename></filename>
        <key>exporterProperties</key>
        <map type="ExporterProperties"/>
    </struct>
</data>
