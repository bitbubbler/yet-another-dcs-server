## Map marker commands

Map marker commands should be typed into the grey/dark box that comes up when you edit a map marker from the f10 map.
Type the command into the marker and then click off of the marker to execute the command

### !spawn

Spawn one or more units of one or more types on the map marker

- `unitName` fuzzy match string for a unit name, can be partial names

**syntax**

```
!spawn <unitName:required>
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

### !destroy

Destroy a unit or spawner near the map marker. The closest unit or spawner to the marker will be destroyed.
You can also specific either unit or spawner type to destroy, and it will only destroy that type.

**syntax**

```
!destroy <toDestroy:optional>
```

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

### !spawngroup

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

### !smoke

Create a smoke marker with the specified color on the map marker. The marker will last 5 minutes.
If no color is given, a green smoke marker will be created.

- `color` fuzzy match string for a color name, can be a partial color name

**syntax**

```
!smoke <color:optional>
```

available colors:

```
green
red
orange
white
blue
```

**examples**

Create red smoke:

```
!smoke red
```

Create white smoke with partial color name:

```
!smoke wh
```

### !flare

Fire a flare with the specified color on the map marker. One flare will be fired into the air.
If no color is given, a green flare will be fired.

- `color` fuzzy match string for a color name, can be a partial color name

**syntax**

```
!flare <color:optional>
```

available colors:

```
green
red
white
yellow
```

**examples**

Fire red flare:

```
!flare red
```

Fire white flare with partial color name:

```
!flare wh
```

### !illumination

Drops an illumination bomb from 500 meters AGL on the map marker. Illumination bombs drift with wind in the mission.

**syntax**

```
!illumination
```

a short version of the command is also available:

```
!illum
```

**examples**

drop illumination bomb on map marker:

```
!illumination
```

## Chat commands

Chat commands should be typed into the chat box that comes up when you hit tab.
Type the command into the message line and then press enter to execute the command

### !defgroup

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
