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

Destroy a unit near the map marker. The closest unit to the marker will be destroyed

**syntax**

```
!destroy
```

**examples**

Destroy unit closest the map marker:

```
!destroy
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
