package com.abbondanzo.journey

import android.os.Bundle
import android.view.Menu
import androidx.appcompat.app.AppCompatActivity
import androidx.drawerlayout.widget.DrawerLayout
import androidx.navigation.NavController
import androidx.navigation.findNavController
import androidx.navigation.ui.AppBarConfiguration
import androidx.navigation.ui.navigateUp
import androidx.navigation.ui.setupActionBarWithNavController
import androidx.navigation.ui.setupWithNavController
import com.abbondanzo.journey.databinding.ActivityMainBinding
import com.google.android.material.navigation.NavigationView
import com.google.android.material.snackbar.Snackbar
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : AppCompatActivity() {

    private lateinit var appBarConfiguration: AppBarConfiguration

    private lateinit var binding: ActivityMainBinding

    private val navController: NavController
        get() = findNavController(R.id.nav_host_fragment)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Binding
        binding = ActivityMainBinding.inflate(layoutInflater)
        val view = binding.root
        setContentView(view)
        // Setup
        setupActionBar()
        setupFab()
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        // Inflate the menu; this adds items to the action bar if it is present.
        menuInflater.inflate(R.menu.main, menu)
        return true
    }

    override fun onSupportNavigateUp(): Boolean {
        return navController.navigateUp(appBarConfiguration) || super.onSupportNavigateUp()
    }

    private fun setupActionBar() {
        val toolbar = binding.appBarMain.toolbar
        setSupportActionBar(toolbar)
        // Hide title passed by fragment
        supportActionBar?.setDisplayShowTitleEnabled(false)
        // Pass each of the navigation fragments
        val drawerLayout: DrawerLayout = findViewById(R.id.drawer_layout)
        appBarConfiguration =
            AppBarConfiguration(setOf(R.id.nav_dashboard, R.id.nav_log_entries), drawerLayout)
        // Assigns title based on navigation fragment label
        navController.addOnDestinationChangedListener { _, destination, _ ->
            binding.appBarMain.toolbarTitle.text = destination.label
        }
        // Nested included views don't work in viewbinding
        val navView: NavigationView = findViewById(R.id.nav_view)
        setupActionBarWithNavController(navController, appBarConfiguration)
        navView.setupWithNavController(navController)
    }

    private fun setupFab() {
        val fab = binding.appBarMain.fab
        fab.setOnClickListener { view ->
            Snackbar.make(view, "Replace with your own action", Snackbar.LENGTH_LONG)
                .setAction("Action", null).show()
        }
    }
}
