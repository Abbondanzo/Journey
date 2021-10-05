import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
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

  // Store date in state internally
  var _date = DateTime.now();

  // Default to disabled since typing in one field validates the rest
  AutovalidateMode _autovalidateMode = AutovalidateMode.disabled;

  @override
  void initState() {
    _updateDateTimer =
        Timer.periodic(Duration(minutes: 1), (Timer t) => _updateDate());
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

  @override
  Widget build(BuildContext context) {
    return Form(
        key: _formKey,
        autovalidateMode: _autovalidateMode,
        child: Container(
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
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
                          onPressed: () => {print('Use Current Location')},
                          child: const Text('Use Current Location'),
                          style: ElevatedButton.styleFrom(
                            minimumSize: Size(double.infinity, 40),
                          ),
                        ),
                        const Center(
                            child: Text('OR', textAlign: TextAlign.center)),
                        OutlinedButton(
                          onPressed: () => {print('Enter Location Manually')},
                          child: const Text('Enter Location Manually'),
                          style: OutlinedButton.styleFrom(
                            minimumSize: Size(double.infinity, 40),
                          ),
                        )
                      ],
                    )),
                ElevatedButton(
                  onPressed: () {
                    if (_formKey.currentState!.validate()) {
                      final entry = Entry(
                          title: _titleController.text,
                          body: _bodyController.text,
                          location: Location('city', 'country', LatLng(1, 2)));
                      context.read<EntriesBloc>().add(AddEntry(entry));
                    } else {
                      setState(() {
                        _autovalidateMode = AutovalidateMode.onUserInteraction;
                      });
                    }
                  },
                  child: const Text('Submit'),
                ),
              ],
            ),
          ),
        ));
  }
}
