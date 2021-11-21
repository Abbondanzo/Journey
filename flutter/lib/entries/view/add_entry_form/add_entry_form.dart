import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:geolocator/geolocator.dart';
import 'package:intl/intl.dart';
import 'package:journey/entries/entries.dart';

extension DateHelpers on DateTime {
  bool isToday() {
    final now = DateTime.now();
    return now.day == this.day &&
        now.month == this.month &&
        now.year == this.year;
  }

  bool isYesterday() {
    final yesterday = DateTime.now().subtract(Duration(days: 1));
    return yesterday.day == this.day &&
        yesterday.month == this.month &&
        yesterday.year == this.year;
  }

  bool isThisYear() {
    return DateTime.now().year == this.year;
  }

  String getDateString() {
    if (this.isToday()) {
      return 'Today';
    } else if (this.isYesterday()) {
      return 'Yesterday';
    } else if (this.isThisYear()) {
      return DateFormat('MMMM d').format(this);
    } else {
      return DateFormat('MMMM d, y').format(this);
    }
  }

  String getTimeString() {
    return DateFormat('h:mm a').format(this);
  }
}

class AddEntryForm extends StatefulWidget {
  @override
  AddEntryFormState createState() {
    return AddEntryFormState();
  }
}

class AddEntryFormState extends State<AddEntryForm> {
  final _formKey = GlobalKey<FormState>();

  final _titleController = TextEditingController();
  final _bodyController = TextEditingController();
  final _dateController = TextEditingController(text: 'Today');
  final _timeController =
      TextEditingController(text: DateTime.now().getTimeString());

  // Use this function to update the dateController in the background
  Timer? _updateDateTimer;

  // Store date and location in state internally
  DateTime _date = DateTime.now();
  Location? _location;

  // Default to disabled since typing in one field validates the rest
  AutovalidateMode _autovalidateMode = AutovalidateMode.disabled;

  @override
  void initState() {
    _updateDateTimer = Timer.periodic(Duration(seconds: 10), (Timer t) {
      final now = DateTime.now();
      if (now.hour == 0 && now.minute == 0 && now.second <= 10) {
        _updateDate();
      }
    });
    super.initState();
  }

  @override
  void dispose() {
    _updateDateTimer?.cancel();
    _titleController.dispose();
    _bodyController.dispose();
    super.dispose();
  }

  void _updateDate() {
    final dateString = _date.getDateString();
    if (dateString != _dateController.text) {
      _dateController.text = dateString;
    }
  }

  Future _selectDate() async {
    final date = await showDatePicker(
        context: context,
        initialDate: _date,
        firstDate: DateTime(1900),
        lastDate: DateTime.now());

    if (date != null) {
      setState(() {
        _dateController.text = date.getDateString();
        _date = date;
      });
    }
  }

  Future _selectTime() async {
    final initialTime = TimeOfDay.fromDateTime(_date);
    final time =
        await showTimePicker(context: context, initialTime: initialTime);
    if (time != null) {
      final combinedDateTime =
          DateTime(_date.year, _date.month, _date.day, time.hour, time.minute);
      setState(() {
        _timeController.text = combinedDateTime.getTimeString();
        _date = combinedDateTime;
      });
    }
  }

  Future _assignCurrentLocation() async {
    bool serviceEnabled;
    LocationPermission permission;

    // Test if location services are enabled.
    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      // Location services are not enabled don't continue
      // accessing the position and request users of the
      // App to enable the location services.
      return Future.error('Location services are disabled.');
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        // Permissions are denied, next time you could try
        // requesting permissions again (this is also where
        // Android's shouldShowRequestPermissionRationale
        // returned true. According to Android guidelines
        // your App should show an explanatory UI now.
        return Future.error('Location permissions are denied');
      }
    }

    if (permission == LocationPermission.deniedForever) {
      // Permissions are denied forever, handle appropriately.
      return Future.error(
          'Location permissions are permanently denied, we cannot request permissions.');
    }

    // When we reach here, permissions are granted and we can
    // continue accessing the position of the device.
    final currentPosition = await Geolocator.getCurrentPosition();

    setState(() {
      _location = Location('Unknown', 'Unknown',
          LatLng(currentPosition.latitude, currentPosition.longitude));
    });
  }

  @override
  Widget build(BuildContext context) {
    return Form(
        key: _formKey,
        autovalidateMode: _autovalidateMode,
        child: Container(
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Padding(
                  padding: const EdgeInsets.all(30),
                  child: Column(
                    children: [
                      TextFormField(
                        decoration: const InputDecoration(
                          labelText: 'Title *',
                          hintText: 'Where did you go?',
                        ),
                        controller: _titleController,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter a title';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Expanded(
                            flex: 2,
                            child: TextFormField(
                              decoration: const InputDecoration(
                                labelText: 'Date *',
                              ),
                              controller: _dateController,
                              readOnly: true,
                              onTap: () {
                                // Stops keyboard from appearing
                                FocusScope.of(context)
                                    .requestFocus(new FocusNode());
                                _selectDate();
                              },
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                              child: TextFormField(
                            decoration: const InputDecoration(
                              labelText: 'Time *',
                            ),
                            controller: _timeController,
                            readOnly: true,
                            keyboardType: TextInputType.name,
                            onTap: () {
                              // Stops keyboard from appearing
                              FocusScope.of(context)
                                  .requestFocus(new FocusNode());
                              _selectTime();
                            },
                          ))
                        ],
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        decoration: const InputDecoration(
                          alignLabelWithHint: true,
                          labelText: 'Body',
                          hintText: 'Tell us about your journey',
                        ),
                        controller: _bodyController,
                        keyboardType: TextInputType.multiline,
                        maxLines: 4,
                      ),
                    ],
                  ),
                ),
                const Divider(),
                Padding(
                    padding: const EdgeInsets.all(30),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Location',
                            style: Theme.of(context).textTheme.headline6),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _assignCurrentLocation,
                          child: const Text('Use Current Location'),
                          style: ElevatedButton.styleFrom(
                            minimumSize: Size(double.infinity, 40),
                          ),
                        ),
                        const Center(
                            child: Text('OR', textAlign: TextAlign.center)),
                        OutlinedButton(
                          onPressed: () {
                            setState(() {
                              _location = Location('Boston', 'United States',
                                  LatLng(42.361145, -71.057083));
                            });
                          },
                          child: const Text('Enter Location Manually'),
                          style: OutlinedButton.styleFrom(
                            minimumSize: Size(double.infinity, 40),
                          ),
                        ),
                        if (_location != null) Text('Location: $_location')
                      ],
                    )),
                const Divider(),
                Padding(
                    padding: const EdgeInsets.all(30),
                    child: ElevatedButton(
                      onPressed: _location == null
                          ? null
                          : () {
                              if (_formKey.currentState!.validate()) {
                                final entry = Entry(
                                    title: _titleController.text,
                                    body: _bodyController.text,
                                    location: _location!);
                                context
                                    .read<EntriesBloc>()
                                    .add(AddEntry(entry));
                                Navigator.pop(context);
                              } else {
                                setState(() {
                                  _autovalidateMode =
                                      AutovalidateMode.onUserInteraction;
                                });
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        minimumSize: Size(double.infinity, 40),
                      ),
                      child: const Text('Submit'),
                    )),
              ],
            ),
          ),
        ));
  }
}
