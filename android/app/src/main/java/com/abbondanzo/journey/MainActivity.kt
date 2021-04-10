package com.abbondanzo.journey

import android.graphics.Bitmap
import android.os.Bundle
import android.view.Menu
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.drawerlayout.widget.DrawerLayout
import androidx.navigation.NavController
import androidx.navigation.findNavController
import androidx.navigation.ui.AppBarConfiguration
import androidx.navigation.ui.navigateUp
import androidx.navigation.ui.setupActionBarWithNavController
import androidx.navigation.ui.setupWithNavController
import com.abbondanzo.journey.databinding.ActivityMainBinding
import com.google.android.material.appbar.AppBarLayout.OnOffsetChangedListener
import com.google.android.material.navigation.NavigationView
import com.google.android.material.snackbar.Snackbar
import dagger.hilt.android.AndroidEntryPoint
import kotlin.math.max

@AndroidEntryPoint
class MainActivity : AppCompatActivity() {

    private lateinit var appBarConfiguration: AppBarConfiguration

    private lateinit var binding: ActivityMainBinding

    private val viewModel: MainViewModel by viewModels()

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
        // Fade contents on scroll
        val appBarLayout = binding.appBarMain.appBarLayout
        appBarLayout.addOnOffsetChangedListener(OnOffsetChangedListener { layout, verticalOffset ->
            val range = (-layout.totalScrollRange).toFloat() * 0.9f
            val alpha = max(1.0f - verticalOffset.toFloat() / range, 0f)
            binding.appBarMain.collapsingToolbarContents.alpha = alpha
        })
        // Nested included views don't work in viewbinding
        val navView: NavigationView = findViewById(R.id.nav_view)
        setupActionBarWithNavController(navController, appBarConfiguration)
        navView.setupWithNavController(navController)
        // Bind profile details
        viewModel.toolbarUsername.observe(this, this::handleToolbarUsername)
        viewModel.toolbarLocation.observe(this, this::handleToolbarLocation)
        viewModel.toolbarProfilePicture.observe(this, this::handleToolbarProfilePicture)
    }

    private fun setupFab() {
        val fab = binding.appBarMain.fab
        fab.setOnClickListener { view ->
            Snackbar.make(view, "Replace with your own action", Snackbar.LENGTH_LONG)
                .setAction("Action", null).show()
        }
    }

    private fun handleToolbarUsername(username: String) {
        binding.appBarMain.toolbarUsername.apply {
            visibility = if (username.isEmpty()) View.GONE else View.VISIBLE
            text = username
        }
    }

    private fun handleToolbarLocation(location: String) {
        binding.appBarMain.toolbarLocation.apply {
            visibility = if (location.isEmpty()) View.GONE else View.VISIBLE
            text = location
        }
    }

    private fun handleToolbarProfilePicture(profilePicture: Bitmap) {
        binding.appBarMain.toolbarProfilePicture.apply {
            visibility = View.VISIBLE
            setImageBitmap(profilePicture)
        }
    }
}
