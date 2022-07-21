- [Map marker commands](#map-marker-commands)
  - [spawn](#spawn)
  - [destroy](#destroy)
  - [spawngroup](#spawngroup)
  - [smoke](#smoke)
  - [flare](#flare)
  - [illumination](#illumination)
  - [spawner](#spawner)
- [Chat commands](#chat-commands)
  - [defgroup](#defgroup)


## Map marker commands

Map marker commands should be typed into the grey/dark box that comes up when you edit a map marker from the f10 map.
Type the command into the marker and then click off of the marker to execute the command

### spawn

Spawn one or more units of one or more types on the map marker

- `unitName` fuzzy match string for a unit name, can be partial names
- `coalition` 'red' or 'blue'

**syntax**

```
!spawn <unitName:required> <coalition:optional>
```

**examples**

Spawn a single T55:

```
!spawn t55
```

Spawn an abrams

```
!spawn abrams
```

Spawn a Hawk track radar

```
!spawn tr
```

Spawn a red ural

```
!spawn red ural
```

Spawn a blue abrams

```
!spawn blue abrams
```

### destroy

Destroy units or spawners near the map marker. The closest unit or spawner to the marker will be destroyed, if no radius is specified.
You can also specify either unit or spawner type to destroy, and it will only destroy that type. You can also specify the coalition. Default coalition is the coalition of the player who created the map marker.

**syntax**

```
!destroy <toDestroy:optional> <radius:optional> <coalition:optional>
```
optional with rad or radius as keyword for the specified radius:
```
!destroy <toDestroy:optional> radius <radius:optional> <coalition:optional>
```

available types to destroy:

```
unit
spawner
```
default: both

available coalitions:

```
blue
red
all
```
default: player coalition

**examples**

Destroy the closest thing the map marker (either unit or spawner):

```
!destroy
```

Destroy unit closest the map marker:

```
!destroy unit
```

Destroy spawner closest the map marker:

```
!destroy spawner
```

Destroy everything from your own coalition in 1000 meter radius:

```
!destroy 1000
```

Destroy blue units in 500 meter radius:

```
!destroy blue unit 500
```

Destroy everything of blue and red coalition using the optional radius keyword for a 1000 meter radius:

```
!destroy all radius 1000
```

### spawngroup

Spawn a previous saved group. The group must exist (create with !defgroup)
Radius is optional. Default radius is 100 meters.
Units will spawn randomly within a circle of given radius

**syntax**

```
!spawngroup <groupName:required> radius <radius:optional>
```

**examples**

Spawn a previous named `tanks` group with the default radius,

```
!spawngroup tanks
```

Spawn a previous named `tanks` group in a 1000 meter radius

```
!spawngroup tanks radius 1000
```

### smoke

Create a smoke marker with the specified color on the map marker. The marker will last for at 5 minutes. 
The command takes a duration value in minutes. Due to DCS limitations one smoke grenade will last 5 minutes. Setting a duration of 7 minutes will result in 10 minutes smoke.
If no color is given, a green smoke marker will be created.

- `color` fuzzy match string for a color name, can be a partial color name

**syntax**

```
!smoke <color:optional> <duration:optional>
```

available colors:

```
green
red
orange
white
blue
```

Duration is set in minutes.

**examples**

Create red smoke:

```
!smoke red
```

Create white smoke with partial color name:

```
!smoke wh
```

Create green smoke marker that lasts 30 minutes:

```
!smoke green 30
```

### flare

Fire a flare with the specified color on the map marker. One flare will be fired into the air.
If no color is given, a green flare will be fired.
If a duration is specified, one flare will be fired each 10 seconds for the set duration in minutes.

- `color` fuzzy match string for a color name, can be a partial color name

**syntax**

```
!flare <color:optional> <duration:optional>
```

available colors:

```
green
red
white
yellow
```
Duration is set in minutes.

**examples**

Fire red flare:

```
!flare red
```

Fire white flare with partial color name:

```
!flare wh
```

Create red flare marker that lasts 5 minutes:

```
!flare green 10
```

### illumination

Drops an illumination bomb from 500 meters AGL on the map marker. Illumination bombs drift with wind in the mission.
One illumination bomb lasts 3 minutes. If a duration is specified, one bomb every 3 minutes is dropped for the set duration in minutes.

**syntax**

```
!illum <duration:optional>
```

**examples**

drop illumination bomb on map marker:

```
!illum
```

Illuminate for 10 minutes:

```
!illum 10
```

### spawner

Create a spawner on the map marker. You can set the spawners type and coalition when you create it

- `type` the type/difficulty of the spawner you want to create. 'easy' 'medium' and 'hard' are valid values. Defaults to easy
- `coalition` the coalition of the spawner you want to create. 'red' and 'blue' are valid values. Defaults to the coalition of the map marker

**syntax**

```
!spawner <coalition:optional> <type:optional>
```

**examples**

Create a spawner for your own coalition with default type:

```
!spawner
```

Create blue spawner with default type:

```
!spawner blue medium
```

Create blue medium spawner:

```
!spawner blue medium
```

Create a red hard spawner:

```
!spawner red hard
```

## Chat commands

Chat commands should be typed into the chat box that comes up when you hit tab.
Type the command into the message line and then press enter to execute the command

### defgroup

Define a named group of units to spawn using f10 markers
Group names must be unique, and are global. If person a and b both make groups named `tanks`, they will overwrite eachother.

**syntax**

```
!defgroup <name:required> [<unitName: required>]...
```

**examples**

Create a group named `tanks` with the units `M-1 Abrams` and `T-55`:

```
!defgroup tanks abrams t55
```
